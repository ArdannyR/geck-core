export default {
  testEnvironment: 'node',
  transform: {}, // Necesario para que Jest no intente compilar con Babel y use el soporte nativo de Node
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Ayuda a resolver las extensiones .js en los imports
  },
  verbose: true, // Muestra el detalle de cada prueba en la consola
};