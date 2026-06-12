import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

const MAX_CONCURRENT_EXECUTIONS = 10;
let activeExecutions = 0;

export const executeCode = async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ ok: false, msg: 'El código y el lenguaje son obligatorios' });
    }

    if (activeExecutions >= MAX_CONCURRENT_EXECUTIONS) {
      return res.status(429).json({
        ok: false,
        msg: 'El servidor está procesando demasiadas ejecuciones. Intenta en unos segundos.'
      });
    }
    activeExecutions++;

    const execId = `run_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const execDir = path.join(process.cwd(), 'uploads', execId);

    await fs.ensureDir(execDir);

    let filePath = '';
    let command = '';
    const langStr = language.toLowerCase();

    const isWindows = process.platform === 'win32';

    if (langStr === 'javascript' || langStr === 'js') {
      filePath = path.join(execDir, 'script.js');
      await fs.writeFile(filePath, code);
      command = `node "${filePath}"`;
    } else if (langStr === 'python' || langStr === 'py') {
      filePath = path.join(execDir, 'script.py');
      await fs.writeFile(filePath, code);
      const pythonCommand = isWindows ? 'python' : 'python3';
      command = `${pythonCommand} "${filePath}"`;
    } else if (langStr === 'c++' || langStr === 'cpp') {
      filePath = path.join(execDir, 'main.cpp');
      await fs.writeFile(filePath, code);
      const outPath = path.join(execDir, isWindows ? 'main.exe' : 'main');
      command = `g++ "${filePath}" -o "${outPath}" && "${outPath}"`;
    } else if (langStr === 'c') {
      filePath = path.join(execDir, 'main.c');
      await fs.writeFile(filePath, code);
      const outPath = path.join(execDir, isWindows ? 'main.exe' : 'main');
      command = `gcc "${filePath}" -o "${outPath}" && "${outPath}"`;
    } else {
      activeExecutions--; // Pequeña corrección extra: restamos si el lenguaje falla
      await fs.remove(execDir).catch(() => {});
      return res.status(400).json({
        ok: false,
        msg: 'Lenguaje no soportado por el servidor. Usa JS, Python, C++ o C.'
      });
    }

    // --- PROTECCIÓN DE VARIABLES DE ENTORNO ---
    // Creamos un entorno (env) seguro que solo tiene variables del sistema operativo
    // Se excluyen por completo process.env.MONGO_URI, JWT_SECRET, PORT, etc.
    const safeEnv = {
      PATH: process.env.PATH, // Indispensable para que sepa dónde está node, python o g++
      ...(isWindows && { SystemRoot: process.env.SystemRoot, TEMP: process.env.TEMP, TMP: process.env.TMP })
    };

    // Pasamos options como { timeout, env, cwd } al exec nativo
    exec(command, { 
      timeout: 8000, 
      env: safeEnv, // <-- Aquí inyectamos el entorno vacío de secretos
      cwd: execDir  // <-- Ejecuta dentro de su propia carpeta, no en la raíz de tu proyecto
    }, async (error, stdout, stderr) => {
      activeExecutions--;
      await fs.remove(execDir).catch(() => {});

      if (error) {
        return res.status(200).json({
          ok: true,
          output: stderr || error.message || 'Error de compilación o tiempo límite excedido.',
          isError: true
        });
      }

      return res.status(200).json({
        ok: true,
        output: stdout,
        isError: false
      });
    });
  } catch (error) {
    activeExecutions--;
    console.error('Error en executeCode:', error);
    return res.status(500).json({ ok: false, msg: 'Error interno al procesar el código' });
  }
};