import sendMail from '../config/nodemailer.js';

export const sendRegistrationEmail = (userMail, token) => {
  return sendMail(
    userMail,
    'Bienvenido a Geck — Confirma tu cuenta',
    `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background-color:#f4f4f8; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
              
              <!-- Header con gradiente morado/azul -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); padding: 40px 40px 32px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:32px; font-weight:800; letter-spacing:-0.5px;">Geck</h1>
                  <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px; letter-spacing:2px; text-transform:uppercase;">Tu escritorio digital</p>
                </td>
              </tr>

              <!-- Ícono central -->
              <tr>
                <td align="center" style="padding: 32px 40px 0;">
                  <div style="display:inline-block; background: linear-gradient(135deg, #ede9fe, #ddd6fe); border-radius:50%; width:72px; height:72px; line-height:72px; text-align:center; font-size:32px;">
                    ✉️
                  </div>
                </td>
              </tr>

              <!-- Contenido -->
              <tr>
                <td style="padding: 24px 48px 8px; text-align:center;">
                  <h2 style="color:#1e1b4b; font-size:22px; font-weight:700; margin:0 0 12px;">¡Bienvenido a Geck!</h2>
                  <p style="color:#6b7280; font-size:15px; line-height:1.7; margin:0 0 28px;">
                    Gracias por unirte. Solo falta un paso: confirma tu correo electrónico para empezar a organizar tu mundo digital.
                  </p>
                </td>
              </tr>

              <!-- Botón -->
              <tr>
                <td align="center" style="padding: 0 48px 32px;">
                  <a href="${process.env.URL_FRONTEND}/confirmar/${token}"
                     style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg, #6366f1, #8b5cf6); color:#ffffff; text-decoration:none; border-radius:50px; font-size:15px; font-weight:600; letter-spacing:0.3px; box-shadow:0 4px 14px rgba(99,102,241,0.4);">
                    Confirmar mi cuenta →
                  </a>
                </td>
              </tr>

              <!-- Separador y nota -->
              <tr>
                <td style="padding: 0 48px 16px;">
                  <div style="border-top: 1px solid #f0eeff; padding-top:20px;">
                    <p style="color:#9ca3af; font-size:12px; text-align:center; margin:0;">
                      Si no creaste esta cuenta, puedes ignorar este correo de forma segura.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #faf5ff, #ede9fe); padding:20px 40px; text-align:center; border-top: 1px solid #f0eeff;">
                  <p style="margin:0; color:#7c3aed; font-size:13px; font-weight:600;">El equipo de Geck 💜</p>
                  <p style="margin:4px 0 0; color:#a78bfa; font-size:11px;">geck.app · Soporte · Privacidad</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  );
};

export const sendPasswordRecoveryEmail = (userMail, token) => {
  return sendMail(
    userMail,
    'Geck — Restablece tu contraseña',
    `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background-color:#f4f4f8; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header con gradiente rojo/naranja -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #f97316 60%, #fb923c 100%); padding: 40px 40px 32px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:32px; font-weight:800; letter-spacing:-0.5px;">Geck</h1>
                  <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px; letter-spacing:2px; text-transform:uppercase;">Recuperación de cuenta</p>
                </td>
              </tr>

              <!-- Ícono central -->
              <tr>
                <td align="center" style="padding: 32px 40px 0;">
                  <div style="display:inline-block; background: linear-gradient(135deg, #fee2e2, #ffedd5); border-radius:50%; width:72px; height:72px; line-height:72px; text-align:center; font-size:32px;">
                    🔐
                  </div>
                </td>
              </tr>

              <!-- Contenido -->
              <tr>
                <td style="padding: 24px 48px 8px; text-align:center;">
                  <h2 style="color:#7f1d1d; font-size:22px; font-weight:700; margin:0 0 12px;">¿Olvidaste tu contraseña?</h2>
                  <p style="color:#6b7280; font-size:15px; line-height:1.7; margin:0 0 28px;">
                    No te preocupes, pasa. Haz clic en el botón de abajo para crear una nueva contraseña segura. Este enlace expira pronto.
                  </p>
                </td>
              </tr>

              <!-- Botón -->
              <tr>
                <td align="center" style="padding: 0 48px 32px;">
                  <a href="${process.env.URL_FRONTEND}/reset/${token}"
                     style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg, #ef4444, #f97316); color:#ffffff; text-decoration:none; border-radius:50px; font-size:15px; font-weight:600; letter-spacing:0.3px; box-shadow:0 4px 14px rgba(239,68,68,0.4);">
                    Restablecer contraseña →
                  </a>
                </td>
              </tr>

              <!-- Separador y nota -->
              <tr>
                <td style="padding: 0 48px 16px;">
                  <div style="border-top: 1px solid #fff1f0; padding-top:20px;">
                    <p style="color:#9ca3af; font-size:12px; text-align:center; margin:0;">
                      Si no solicitaste este cambio, ignora este correo. Tu cuenta permanece segura.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #fff7ed, #fee2e2); padding:20px 40px; text-align:center; border-top: 1px solid #fff1f0;">
                  <p style="margin:0; color:#ef4444; font-size:13px; font-weight:600;">El equipo de Geck 🔥</p>
                  <p style="margin:4px 0 0; color:#fb923c; font-size:11px;">geck.app · Soporte · Privacidad</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  );
};

export const sendWorkspaceInviteEmail = ({ to, inviterName, workspaceName, token, workspaceId }) => {
  const acceptUrl = `${process.env.URL_FRONTEND}/workspace/accept/${token}`;

  return sendMail(
    to,
    `${inviterName} te invitó a "${workspaceName}" en Geck`,
    `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background-color:#f4f4f8; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header con gradiente verde/teal -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%); padding: 40px 40px 32px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:32px; font-weight:800; letter-spacing:-0.5px;">Geck</h1>
                  <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px; letter-spacing:2px; text-transform:uppercase;">Invitación a workspace</p>
                </td>
              </tr>

              <!-- Ícono central -->
              <tr>
                <td align="center" style="padding: 32px 40px 0;">
                  <div style="display:inline-block; background: linear-gradient(135deg, #d1fae5, #ccfbf1); border-radius:50%; width:72px; height:72px; line-height:72px; text-align:center; font-size:32px;">
                    🤝
                  </div>
                </td>
              </tr>

              <!-- Contenido -->
              <tr>
                <td style="padding: 24px 48px 16px; text-align:center;">
                  <h2 style="color:#064e3b; font-size:22px; font-weight:700; margin:0 0 12px;">¡Te invitaron a colaborar!</h2>
                  <p style="color:#6b7280; font-size:15px; line-height:1.7; margin:0 0 20px;">
                    <strong style="color:#374151;">${inviterName}</strong> te invitó a unirte al espacio de trabajo:
                  </p>
                </td>
              </tr>

              <!-- Tarjeta del workspace -->
              <tr>
                <td style="padding: 0 48px 28px;">
                  <div style="background: linear-gradient(135deg, #ecfdf5, #f0fdfa); border: 1.5px solid #a7f3d0; border-radius:12px; padding:18px 24px; text-align:center;">
                    <p style="margin:0; color:#065f46; font-size:18px; font-weight:700;">🗂️ ${workspaceName}</p>
                  </div>
                </td>
              </tr>

              <!-- Botón -->
              <tr>
                <td align="center" style="padding: 0 48px 32px;">
                  <a href="${acceptUrl}"
                     style="display:inline-block; padding:14px 36px; background:linear-gradient(135deg, #10b981, #06b6d4); color:#ffffff; text-decoration:none; border-radius:50px; font-size:15px; font-weight:600; letter-spacing:0.3px; box-shadow:0 4px 14px rgba(16,185,129,0.4);">
                    Aceptar invitación →
                  </a>
                </td>
              </tr>

              <!-- Separador y nota -->
              <tr>
                <td style="padding: 0 48px 16px;">
                  <div style="border-top: 1px solid #ecfdf5; padding-top:20px;">
                    <p style="color:#9ca3af; font-size:12px; text-align:center; margin:0;">
                      Este enlace expirará en <strong>48 horas</strong>. Si no esperabas esta invitación, puedes ignorarlo.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #ecfdf5, #f0fdfa); padding:20px 40px; text-align:center; border-top: 1px solid #d1fae5;">
                  <p style="margin:0; color:#059669; font-size:13px; font-weight:600;">El equipo de Geck 🌿</p>
                  <p style="margin:4px 0 0; color:#34d399; font-size:11px;">geck.app · Soporte · Privacidad</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  );
};

export const sendDesktopShareEmail = ({ to, ownerName }) => {
  return sendMail(
    to,
    `${ownerName} ha compartido su escritorio contigo en Geck`,
    `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0; padding:0; background-color:#f4f4f8; font-family: 'Segoe UI', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header con gradiente índigo -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); padding: 40px 40px 32px; text-align: center;">
                  <h1 style="margin:0; color:#ffffff; font-size:32px; font-weight:800; letter-spacing:-0.5px;">Geck</h1>
                  <p style="margin:8px 0 0; color:rgba(255,255,255,0.85); font-size:14px; letter-spacing:2px; text-transform:uppercase;">Escritorio compartido</p>
                </td>
              </tr>

              <!-- Ícono central -->
              <tr>
                <td align="center" style="padding: 32px 40px 0;">
                  <div style="display:inline-block; background: linear-gradient(135deg, #ede9fe, #ddd6fe); border-radius:50%; width:72px; height:72px; line-height:72px; text-align:center; font-size:32px;">
                    🖥️
                  </div>
                </td>
              </tr>

              <!-- Contenido -->
              <tr>
                <td style="padding: 24px 48px 16px; text-align:center;">
                  <h2 style="color:#1e1b4b; font-size:22px; font-weight:700; margin:0 0 12px;">Escritorio compartido</h2>
                  <p style="color:#6b7280; font-size:15px; line-height:1.7; margin:0;">
                    <strong style="color:#374151;">${ownerName}</strong> ha compartido su escritorio personal contigo.
                  </p>
                  <p style="color:#6b7280; font-size:15px; line-height:1.7; margin:16px 0 0;">
                    Ya puedes verlo desde tu cuenta en Geck.
                  </p>
                </td>
              </tr>

              <!-- Separador -->
              <tr>
                <td style="padding: 0 48px 16px;">
                  <div style="border-top: 1px solid #f0eeff; padding-top:20px;">
                    <p style="color:#9ca3af; font-size:12px; text-align:center; margin:0;">
                      Si no esperabas esta notificación, puedes ignorar este correo.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background: linear-gradient(135deg, #faf5ff, #ede9fe); padding:20px 40px; text-align:center; border-top: 1px solid #f0eeff;">
                  <p style="margin:0; color:#7c3aed; font-size:13px; font-weight:600;">El equipo de Geck</p>
                  <p style="margin:4px 0 0; color:#a78bfa; font-size:11px;">geck.app · Soporte · Privacidad</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  );
};