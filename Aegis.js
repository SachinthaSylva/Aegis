// SERVER LOGGING - SIGN LOGGER
// Tracks sign placement AND edits, logging full text content to playeractions.log

const signTextCache = {};      // last-known text per sign position
const signEditPending = {};    // prevents overlapping poll loops on the same sign

// Fill this in with whatever words/phrases you want flagged in the log.
const FLAGGED_WORDS = [
    // 'example_bad_word1',
    // 'example_bad_word2',
];

function posKey(level, block) {
    return `${level.dimension}_${block.x}_${block.y}_${block.z}`;
}

function readSignLines(signEntity) {
    const result = { front: [], back: [] };
    try {
        const frontMessages = signEntity.getFrontText().getMessages(false);
        const backMessages = signEntity.getBackText().getMessages(false);
        for (let i = 0; i < frontMessages.length; i++) result.front.push(frontMessages[i].getString());
        for (let i = 0; i < backMessages.length; i++) result.back.push(backMessages[i].getString());
    } catch (e) {
        console.error(`[Aegis - Sign Logger] Failed to read sign NBT: ${e}`);
    }
    return result;
}

function containsFlaggedWord(lines) {
    let combined = lines.front.concat(lines.back).join(' ').toLowerCase();
    return FLAGGED_WORDS.some(word => combined.includes(word.toLowerCase()));
}

function formatLines(lines) {
    let front = lines.front.filter(l => l.length > 0).join(' | ') || '(blank)';
    let back = lines.back.filter(l => l.length > 0).join(' | ') || '(blank)';
    return `FRONT: "${front}" BACK: "${back}"`;
}

function logPlayerAction(message) {
    const File = Java.loadClass('java.io.File');
    const FileWriter = Java.loadClass('java.io.FileWriter');
    const BufferedWriter = Java.loadClass('java.io.BufferedWriter');
    const PrintWriter = Java.loadClass('java.io.PrintWriter');

    let logFile = new File('logs/playeractions.log');
    let timestamp = new Date().toISOString();

    try {
        let fw = new FileWriter(logFile, true);
        let bw = new BufferedWriter(fw);
        let pw = new PrintWriter(bw);
        pw.println(`[${timestamp}] ${message}`);
        pw.close();
    } catch (e) {
        console.error(`[Aegis - Sign Logger] Failed to write to playeractions.log: ${e}`);
    }
}

// --- PLACEMENT ---
BlockEvents.placed('#minecraft:signs', event => {
    let player = event.player;
    let block = event.block;
    let key = posKey(event.level, block);

    let lines = { front: [], back: [] };
    try {
        lines = readSignLines(block.entity);
    } catch (e) { /* freshly placed signs are usually blank */ }
    signTextCache[key] = lines;

    if (player) {
        logPlayerAction(`[Sign Logger] Player ${player.name.getString()} placed a sign at X:${block.x} Y:${block.y} Z:${block.z} in ${event.level.dimension} - ${formatLines(lines)}`);
    } else {
        logPlayerAction(`[Sign Logger] A sign was placed at X:${block.x} Y:${block.y} Z:${block.z} in ${event.level.dimension} by an unknown source (worldgen/command).`);
    }
});

// --- EDITS ---
BlockEvents.rightClicked('#minecraft:signs', event => {
    let player = event.player;
    let block = event.block;
    let level = event.level;
    if (!player) return;

    let key = posKey(level, block);
    if (signEditPending[key]) return; // already polling this sign, don't stack another loop

    let playerName = player.name.getString();
    let x = block.x, y = block.y, z = block.z;

    signEditPending[key] = true;
    pollForSignEdit(event.server, level, x, y, z, key, playerName, 12); // 12 x 5s = up to 60s
});

function pollForSignEdit(server, level, x, y, z, key, playerName, attemptsLeft) {
    server.scheduleInTicks(100, server, ctx => { // 100 ticks = 5 seconds
        let currentBlock = level.getBlock(x, y, z);
        if (!currentBlock || !currentBlock.entity) {
            delete signEditPending[key]; // sign got broken, stop polling
            return;
        }

        let newLines = readSignLines(currentBlock.entity);
        let oldLines = signTextCache[key] || { front: [], back: [] };
        let changed = JSON.stringify(newLines) !== JSON.stringify(oldLines);

        if (changed) {
            let flagNote = containsFlaggedWord(newLines) ? ' [FLAGGED CONTENT]' : '';
            logPlayerAction(`[Sign Logger]${flagNote} Player ${playerName} edited a sign at X:${x} Y:${y} Z:${z} in ${level.dimension} - ${formatLines(newLines)}`);
            signTextCache[key] = newLines;
            delete signEditPending[key]; // found the edit, stop polling
            return;
        }

        if (attemptsLeft > 1) {
            pollForSignEdit(server, level, x, y, z, key, playerName, attemptsLeft - 1);
        } else {
            delete signEditPending[key]; // gave up after 60s, player probably didn't edit
        }
    });
}
