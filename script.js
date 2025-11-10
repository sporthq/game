document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.querySelector('.game-container');
    const gameSection = document.getElementById('game-section');
    const gameBoard = document.getElementById('game-board');
    const gameBoardWrapper = document.getElementById('game-board-wrapper');
    const gameExitDoor = document.getElementById('game-exit-door');
    const resetButton = document.getElementById('reset-button');
    const messageArea = document.getElementById('message-area');
    const promoCodeArea = document.getElementById('promo-code-area');
    const promoCodeDisplay = document.getElementById('promo-code');
    const copyCodeButton = document.getElementById('copy-code-button');

    let boardSize = 4;
    let cellSize = 90;

    let blocks = [];
    let isDragging = false;
    let draggedBlock = null;
    let startX, startY; // Mouse/touch start position
    let startBlockX, startBlockY; // Block's grid position at start of drag

    const simpleLevel = {
        boardSize: 4,
        blocks: [
            // Key: Position (0,1), width 2, height 1
            { id: 'key', x: 0, y: 1, width: 2, height: 1, isKey: true },

            // Vertical block 1: blocks key's path. Must be moved DOWN
            { id: 'b1', x: 2, y: 0, width: 1, height: 2 },

            // Horizontal block 2: Additional obstacle at the bottom, blocking b1.
            // Must be moved LEFT for b1 to move.
            { id: 'b2', x: 2, y: 2, width: 2, height: 1 }

            // Removed decorative corner blocks (b3, b4, b5, b6)
        ],
        // Exit is now defined as a point on the right edge (y coordinate)
        // The key needs to move past boardSize (x:4) at this y coordinate
        exit: { x: boardSize, y: 1 },
        promoCode: "NEWCODE2024"
    };

    function initializeGame() {
        gameSection.classList.add('hidden');
        promoCodeArea.classList.add('hidden');
        resetButton.classList.add('hidden');
        messageArea.textContent = '';

        initializeBoardElements(simpleLevel);
    }

    function initializeBoardElements(level) {
        blocks = JSON.parse(JSON.stringify(level.blocks));

        gameBoard.style.gridTemplateColumns = `repeat(${boardSize}, ${cellSize}px)`;
        gameBoard.style.gridTemplateRows = `repeat(${boardSize}, ${cellSize}px)`;
        gameBoard.style.width = `${boardSize * cellSize}px`;
        gameBoard.style.height = `${boardSize * cellSize}px`;
        gameBoard.innerHTML = ''; // Clear previous blocks

        // Position the exit door
        positionExitDoor(level.exit);

        blocks.forEach(block => {
            const blockElement = document.createElement('div');
            blockElement.classList.add('block');
            if (block.isKey) {
                blockElement.classList.add('key');
            }
            blockElement.id = block.id;

            blockElement.style.left = `${block.x * cellSize}px`;
            blockElement.style.top = `${block.y * cellSize}px`;
            blockElement.style.width = `${block.width * cellSize}px`;
            blockElement.style.height = `${block.height * cellSize}px`;

            gameBoard.appendChild(blockElement);
        });

        gameSection.classList.remove('hidden');
        addDragListeners();
    }

    // Updated positionExitDoor function
    function positionExitDoor(exit) {
        // Place the door just outside the right edge of the board
        gameExitDoor.style.left = `${boardSize * cellSize}px`;
        gameExitDoor.style.top = `${exit.y * cellSize}px`;
        gameExitDoor.style.width = `${cellSize}px`; // Door width same as cell
        // Height of the door should match the key's height if key is 1x2 or 2x1 etc.
        // Assuming key is 1 cell high for now, if key is taller, adjust this
        const keyHeight = simpleLevel.blocks.find(b => b.isKey).height;
        gameExitDoor.style.height = `${keyHeight * cellSize}px`;
        gameExitDoor.style.display = 'flex'; // Ensure visibility
    }

    function addDragListeners() {
        gameBoard.querySelectorAll('.block').forEach(blockElement => {
            blockElement.removeEventListener('mousedown', startDrag);
            blockElement.removeEventListener('touchstart', startDrag);
            blockElement.addEventListener('mousedown', startDrag);
            blockElement.addEventListener('touchstart', startDrag, { passive: false });
        });
    }

    function startDrag(e) {
        isDragging = true;
        draggedBlock = blocks.find(b => b.id === e.target.id);
        if (!draggedBlock) return;

        startX = e.clientX || e.touches[0].clientX;
        startY = e.clientY || e.touches[0].clientY;
        startBlockX = draggedBlock.x;
        startBlockY = draggedBlock.y;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', drag, { passive: false });
        document.addEventListener('touchend', endDrag);

        e.target.style.zIndex = 100;
        gameBoard.style.cursor = 'grabbing';
    }

    function drag(e) {
        if (!isDragging || !draggedBlock) return;
        e.preventDefault();

        const currentX = e.clientX || e.touches[0].clientX;
        const currentY = e.clientY || e.touches[0].clientY;

        const deltaX = currentX - startX;
        const deltaY = currentY - startY;

        const blockElement = document.getElementById(draggedBlock.id);

        let tempLeft = startBlockX * cellSize;
        let tempTop = startBlockY * cellSize;

        if (draggedBlock.width > draggedBlock.height) { // Horizontal block
            tempLeft = (startBlockX * cellSize) + deltaX;
            // Allow key to go beyond boardSize on the right
            let maxLeft = (draggedBlock.isKey) ? (boardSize * cellSize) : ((boardSize - draggedBlock.width) * cellSize);
            tempLeft = Math.max(0, Math.min(maxLeft, tempLeft));
        } else { // Vertical block
            tempTop = (startBlockY * cellSize) + deltaY;
            tempTop = Math.max(0, Math.min((boardSize - draggedBlock.height) * cellSize, tempTop));
        }

        blockElement.style.left = `${tempLeft}px`;
        blockElement.style.top = `${tempTop}px`;
    }

    function endDrag(e) {
        if (!isDragging || !draggedBlock) return;

        isDragging = false;
        gameBoard.style.cursor = 'grab';
        document.getElementById(draggedBlock.id).style.zIndex = 1;

        const blockElement = document.getElementById(draggedBlock.id);

        // Calculate potential final grid position
        let finalX = Math.round(parseInt(blockElement.style.left) / cellSize);
        let finalY = Math.round(parseInt(blockElement.style.top) / cellSize);

        // Special handling for the key exiting the board
        if (draggedBlock.isKey && finalX + draggedBlock.width > boardSize && finalY === simpleLevel.exit.y) {
            // If key is exiting, allow it to move off-board visually
            draggedBlock.x = finalX; // Update logical position
            draggedBlock.y = finalY;
            blockElement.style.left = `${finalX * cellSize}px`;
            blockElement.style.top = `${finalY * cellSize}px`;
            checkWinCondition();
            return; // Exit early, win condition handled
        }

        // For all other blocks (and key if not exiting)
        if (isValidMove(draggedBlock, finalX, finalY)) {
            draggedBlock.x = finalX;
            draggedBlock.y = finalY;
            blockElement.style.left = `${finalX * cellSize}px`;
            blockElement.style.top = `${finalY * cellSize}px`;
            checkWinCondition(); // Check win condition for key even if not fully off board yet
        } else {
            // Revert to start position if move is invalid
            blockElement.style.left = `${startBlockX * cellSize}px`;
            blockElement.style.top = `${startBlockY * cellSize}px`;
            draggedBlock.x = startBlockX;
            draggedBlock.y = startBlockY;
        }

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('touchend', endDrag);

        draggedBlock = null;
    }

    function isValidMove(currentBlock, targetX, targetY) {
        // Allow the key to move past the board boundary IF it's on the exit row
        if (currentBlock.isKey && targetY === simpleLevel.exit.y && (targetX + currentBlock.width > boardSize)) {
            return true; // This is the winning move, allow it
        }

        // General boundary check for all other moves/blocks
        if (targetX < 0 || targetY < 0 ||
            (targetX + currentBlock.width) > boardSize ||
            (targetY + currentBlock.height) > boardSize) {
            return false;
        }

        // Check collision with other blocks
        for (const otherBlock of blocks) {
            if (otherBlock.id === currentBlock.id) continue;

            const currentRect = {
                x: targetX, y: targetY,
                width: currentBlock.width, height: currentBlock.height
            };
            const otherRect = {
                x: otherBlock.x, y: otherBlock.y,
                width: otherBlock.width, height: otherBlock.height
            };

            if (currentRect.x < otherRect.x + otherRect.width &&
                currentRect.x + currentRect.width > otherRect.x &&
                currentRect.y < otherRect.y + otherRect.height &&
                currentRect.y + currentRect.height > otherRect.y) {
                return false;
            }
        }
        return true;
    }

    function checkWinCondition() {
        const keyBlock = blocks.find(b => b.isKey);
        const exit = simpleLevel.exit;

        // Win condition: Key's right edge is past the board's right edge AND it's on the correct Y row
        if (keyBlock.x + keyBlock.width > boardSize && keyBlock.y === exit.y) {
            messageArea.textContent = `Congratulations! Door open, code unlocked!`;

            gameBoard.querySelectorAll('.block').forEach(blockElement => {
                blockElement.removeEventListener('mousedown', startDrag);
                blockElement.removeEventListener('touchstart', startDrag);
                blockElement.style.cursor = 'default';
            });

            // Make the key fully disappear if it's past the edge
            const keyElement = document.getElementById('key');
            keyElement.style.transition = 'left 0.5s ease-out';
            keyElement.style.left = `${(boardSize + 1) * cellSize}px`; // Move fully out

            setTimeout(() => { // Hide game elements after key moves out
                gameSection.classList.add('hidden');
                promoCodeDisplay.textContent = simpleLevel.promoCode;
                promoCodeArea.classList.remove('hidden');
                resetButton.classList.remove('hidden');
            }, 500); // Wait for key animation to finish
        }
    }

    resetButton.addEventListener('click', () => {
        initializeGame();
    });

    copyCodeButton.addEventListener('click', () => {
        const codeText = promoCodeDisplay.textContent;
        navigator.clipboard.writeText(codeText)
            .then(() => {
                copyCodeButton.textContent = "Copied!";
                setTimeout(() => { copyCodeButton.textContent = "Copy Code"; }, 1500);
            })
            .catch(err => {
                console.error('Failed to copy code:', err);
                alert('Failed to copy code. Please try to select and copy manually.');
            });
    });

    initializeGame();
});