// SERVER LOGGING - SIGN LOGGER
BlockEvents.placed('minecraft:sign', event => {
    let player = event.player;
    let block = event.block;

    // Logs the player's name and coordinates to the server console
    console.info(`[Sign Logger] Player ${player.name.getString()} placed a sign at X:${block.x} Y:${block.y} Z:${block.z}`);
});
