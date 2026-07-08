// SERVER LOGGING - SIGN LOGGER
BlockEvents.placed('minecraft:sign', event => {
    let player = event.player;
    let block = event.block;

    let message;
    if (player) {
        message = `[Aegis - Sign Logger] Player ${player.name.getString()} placed a sign at X:${block.x} Y:${block.y} Z:${block.z}`;
    } else {
        message = `[Aegis - Sign Logger] A sign was placed at X:${block.x} Y:${block.y} Z:${block.z} by an unknown player. This may be due to worldgen or commands placing the sign.`;
    }

    logPlayerAction(message);
});

// Utility function to append a timestamped line to logs/playeractions.log
function logPlayerAction(message) {
    const File = Java.loadClass('java.io.File');
    const FileWriter = Java.loadClass('java.io.FileWriter');
    const BufferedWriter = Java.loadClass('java.io.BufferedWriter');
    const PrintWriter = Java.loadClass('java.io.PrintWriter');

    let logFile = new File('logs/playeractions.log');
    let timestamp = new Date().toISOString();

    try {
        let fw = new FileWriter(logFile, true); // true = append, don't overwrite
        let bw = new BufferedWriter(fw);
        let pw = new PrintWriter(bw);
        pw.println(`[${timestamp}] ${message}`);
        pw.close();
    } catch (e) {
        // Fallback to console if file write fails, so you still see the error somewhere
        console.error(`[Aegis - Sign Logger] Failed to write to playeractions.log: ${e}`);
    }
}
