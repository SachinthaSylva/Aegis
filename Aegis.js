// SERVER LOGGING - SIGN LOGGER
BlockEvents.placed('minecraft:sign', event => {
    let player = event.player;
    let block = event.block;
    if (player){
    // Logs the player's name and coordinates to the server console
    console.info(`[Aegis - Sign Logger] Player ${player.name.getString()} placed a sign at X:${block.x} Y:${block.y} Z:${block.z}`);
    }
    else{
    console.info('[Aegis - Sign Logger] A sign was placed at X:${block.x} Y:${block.y} Z:${block.z} by an unknown player. \nThis may be due to worldgen or commands placing the sign.');
    }
});
