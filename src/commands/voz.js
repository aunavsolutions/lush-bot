import { SlashCommandBuilder } from 'discord.js';
import { handleVozEntrar, handleVozSalir } from '../voice/voiceManager.js';

export const vozCommand = new SlashCommandBuilder()
  .setName('voz')
  .setDescription('Comandos de voz del bot')
  .addSubcommand(sub => 
    sub.setName('entrar')
      .setDescription('Hace que el bot entre a tu canal de voz actual')
  )
  .addSubcommand(sub => 
    sub.setName('salir')
      .setDescription('Hace que el bot salga del canal de voz')
  );

export async function executeVoz(interaction) {
  const subcommand = interaction.options.getSubcommand();
  
  if (subcommand === 'entrar') {
    await handleVozEntrar(interaction);
  } else if (subcommand === 'salir') {
    await handleVozSalir(interaction);
  }
}
