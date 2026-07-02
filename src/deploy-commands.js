// src/deploy-commands.js
// Ejecutar UNA VEZ para registrar los slash commands en Discord
// Uso: node src/deploy-commands.js

import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { commands } from './commands/index.js';

config();

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registrando slash commands...');

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );

    console.log('✅ Comandos registrados correctamente.');
    console.log('Comandos disponibles:');
    commands.forEach(cmd => console.log(`  /${cmd.name} — ${cmd.description}`));
  } catch (error) {
    console.error('Error al registrar comandos:', error);
  }
})();
