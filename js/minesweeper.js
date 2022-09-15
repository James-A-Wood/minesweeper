import { Sounds } from "/minesweeper/js/modules/Sounds.js";
import { Clock } from "/minesweeper/js/modules/Clock.js";
import { BalloonCelebration } from "/minesweeper/js/modules/balloonCelebration.js";
import { fitInParent } from "/minesweeper/js/fitInParent.js";
import "/minesweeper/js/jquery.js";

// bandaging the mobile-vh bug
["resize", "orientationchange", "touchend", "click"].forEach(event =>
    window.addEventListener(event, () => document.querySelector("#everything-holder").style.height = window.innerHeight + "px")
);

const log = console.log;
const body = document.querySelector("body");

function EventCounter(obj) {

    const intervalsArray = [];

    let t1 = undefined;

    const markInterval = () => {
        const t2 = Date.now();
        if (t1) intervalsArray.push(t2 - t1);
        t1 = t2;
    };

    this.clear = () => {
        intervalsArray.length = 0;
        t1 = undefined;
    };

    this.getAverage = () => {
        let total = 0;
        intervalsArray.forEach(time => total += time);
        return intervalsArray.length ? total / this.getNumEvents() : 0;
    };

    this.getNumEvents = () => t1 ? intervalsArray.length + 1 : 0;

    this.markEvent = () => markInterval();
}

function FlagMode(obj = {}) {

    const flagButton = obj.id ?? document.querySelector("#flag-button");
    const flagModeClass = obj.flagModeClass ?? "flag-mode";
    const isOn = () => flagButton.classList.contains(flagModeClass);

    const changeMode = val => {
        val = val ?? !isOn();
        flagButton.classList.toggle(flagModeClass, val);
        this.isActive = isOn();
    };

    flagButton.onclick = () => changeMode();
    window.addEventListener("keyup", e => e.key === "f" && changeMode());

    this.isActive = false;
    this.deactivate = () => changeMode(false);
    this.activate = () => changeMode(true);
}

function PauseButton(klass, settings = {}) {

    const buttons = document.querySelectorAll(klass);
    const pausedClass = settings.pausedClass ?? "paused";

    this.isActive = () => true;
    this.isPaused = () => body.classList.contains(pausedClass);
    this.onChangePausedState = () => undefined;

    this.toggleOnKey = "";

    this.togglePause = () => {
        if (!this.isActive()) return false;
        body.classList.toggle(pausedClass);
        this.onChangePausedState(this.isPaused());
        return this.isPaused();
    };

    document.addEventListener("keyup", e => {
        this.toggleOnKey = Array.isArray(this.toggleOnKey) ? this.toggleOnKey : [this.toggleOnKey];
        if (this.toggleOnKey.includes(e.key)) this.togglePause();
    });

    buttons.forEach(button => button.onclick = () => this.togglePause());
}

function MuteButton(id, settings = {}) {

    const button = settings.button ?? document.querySelector(id);
    const localStorageKey = settings.localStorageKey ?? "minesweeper_is_muted";
    const mutedClass = settings.mutedClass ?? "muted";

    this.isActive = () => true;
    this.isMuted = () => button.classList.contains(mutedClass);
    this.setMutedState = () => toggle();
    this.toggle = this.setMutedState;

    if (localStorage[localStorageKey] === "true") button.classList.add(mutedClass);

    const saveValueToLocalStorage = val => {
        val = val ?? localStorage[localStorageKey] ?? false;
        localStorage[localStorageKey] = val;
    };

    const toggle = () => {
        if (!this.isActive()) return false;
        button.classList.toggle(mutedClass);
        saveValueToLocalStorage(this.isMuted());
    };

    button.onclick = toggle;
}

function BackgroundImage() {
    const numImages = 12;
    const key = "minesweeper_background_image";

    this.rotate = () => {
        // 12 images, hardcoded unfortunately
        for (let i = 1; i < 13; i++) body.classList.remove("bg" + i);
        if (!localStorage[key] || isNaN(localStorage[key]))
            localStorage[key] = 0;
        let index = localStorage[key] % numImages;
        body.classList.add("bg" + ++index);
        localStorage[key] = index;
    };
}

function LevelSelect(obj = {}) {
    const key = obj.key ?? "minesweeper_level";
    const selector = document.querySelector(obj.selectorId ?? "#level-select");

    selector.onchange = () => {
        localStorage[key] = selector.value;
        this.onChange();
    };

    const settings = obj.settings ?? {
        easy: {
            cellsPerRow: 7,
            numMines: 7
        },
        medium: {
            cellsPerRow: 10,
            numMines: 15
        },
        difficult: {
            cellsPerRow: 13,
            numMines: 30
        },
        jesus: {
            cellsPerRow: 20,
            numMines: 50
        }
    };

    if (localStorage[key]) selector.value = localStorage[key];

    this.onChange = () => undefined;

    this.getSettings = () => {
        const level = selector.value;
        const numMines = settings[level].numMines;
        const cellsPerRow = settings[level].cellsPerRow;
        const numEmpty = cellsPerRow * cellsPerRow - numMines;
        const numCells = cellsPerRow * cellsPerRow;
        return { numMines, cellsPerRow, numEmpty, level, numCells };
    };
}

function Explosions() {

    const explosionsArray = [];

    const explosionRingMaster = document
        .querySelector(".explosion-ring")
        .cloneNode(true);
    explosionRingMaster.classList.remove("my-template");
    document.querySelector(".explosion-ring").remove();

    this.new = cell => {
        const explosionRing = explosionRingMaster.cloneNode(true);
        const rect = cell.getBoundingClientRect();
        explosionsArray.push(explosionRing);
        explosionRing.classList.add("explosion-ring");
        explosionRing.style.left = rect.left + rect.width / 2 + "px";
        explosionRing.style.top = rect.top + rect.height / 2 + "px";
        body.appendChild(explosionRing);
        setTimeout(() => explosionRing.remove(), 2000);
    };

    this.clear = () => {
        explosionsArray.forEach(elem => elem.remove());
        explosionsArray.length = 0;
    };
}

function Minefield(sounds, explosions, flagMode, obj = {}) {

    const minefieldTable = document.querySelector(
        obj.minefieldTableId ?? "#minefield-table"
    );
    const cellMaster = document
        .querySelector(obj.cellClass ?? ".cell.my-template")
        .cloneNode(true);
    const minesArray = []; // indexes of cells with mines
    const clickedArray = []; // indexes of clicked cells
    const cellsArray = []; // list of the actual cell elements
    const textSize = obj.textSize ?? 0.4;

    cellMaster.classList.remove("my-template");
    document.querySelector(".cell").remove();

    let cellsPerRow, numMines, numCells, numEmpty;

    this.isActive = true;
    this.endSequence = () => undefined;
    this.onClick = () => undefined;
    this.getSettings = () => undefined;
    this.onCellOpen = () => undefined;
    this.onCascade = () => undefined;

    this.hideFlags = () =>
        document
            .querySelectorAll(".cell")
            .forEach(cell => cell.classList.remove("flagged"));

    this.buildTable = () => {
        clearGame();
        this.isActive = true;
        // need the surrounding parentheses!
        ({ cellsPerRow, numMines, numEmpty, numCells } = this.getSettings());
        const cellSideLength = (cellsPerRow / numCells) * 100 + "%";
        for (let i = 0; i < numCells; i++)
            setTimeout(() => newCell(cellSideLength), i * 5);
        window.dispatchEvent(new Event("resize"));
    };

    this.getPercentCompleted = () =>
        (clickedArray.length / (numCells - numMines)) * 100;
    this.getScore = () =>
        numEmpty - getNumRemainingEmptyLeft() + " / " + numEmpty;

    this.showMines = (obj = {}) => {
        const durationMs = obj.durationMs ?? 100;

        if (obj.index) moveToArrayFront(minesArray, obj.index); // so the clicked mine explodes first

        minesArray.forEach(function (mineIndex, iteration) {
            setTimeout(() => {
                const cell = cellsArray[mineIndex];
                cell.classList.add("show-mine", "contains-mine", "clicked");
                explosions.new(cell);
            }, (iteration * durationMs) / numMines);
        });

        minefieldTable.classList.add("shake");

        if (obj.onFinish) setTimeout(obj.onFinish, durationMs);
    };

    function newCell(cellSideLength) {
        const cell = cellMaster.cloneNode(true);
        const textHolder = cell.querySelector(".text-holder");
        textHolder.style.fontSize = `${textSize *
            parseInt(cellSideLength)}vmin`;
        cell.onclick = () => clickHandler(cell, true); // true => do play sounds
        minefieldTable.appendChild(cell);
        cell.style.width = cellSideLength;
        cell.style.height = cellSideLength;
        cellsArray.push(cell);
        cell.reveal = numAdjacentMines => {
            textHolder.classList.add("adj-" + numAdjacentMines);
            textHolder.textContent = numAdjacentMines;
        };
    }

    const clearGame = () => {
        minesArray.length = 0;
        cellsArray.length = 0;
        clickedArray.length = 0;
        minefieldTable.querySelectorAll(".cell").forEach(cell => cell.remove());
        minefieldTable.classList.remove("shake");
        return this;
    };

    const flagHandler = cell => {
        cell.classList.toggle("flagged");
        return this;
    };

    const clickHandler = (cell, playSounds = true) => {

        const index = cellsArray.indexOf(cell);
        layMines(index); // laying mines after first click so that the very first cell clicked doesn't contain a mine
        this.onClick();
        if (clickedArray.includes(index) || !this.isActive) return false;
        if (flagMode.isActive) return flagHandler(cell);
        clickedArray.push(index);
        cell.classList.remove("flagged");
        cell.classList.add("clicked");

        if (playSounds) this.onCellOpen();

        if (minesArray.includes(index)) return this.endSequence(index, false);

        const numAdjacentMines = getNumAdjacentMines(index);

        // NEW TEST not playing the click sound when muliple are opening
        if (playSounds && numAdjacentMines > 0) sounds.play("tick");
        if (getNumRemainingEmptyLeft() === 0) return this.endSequence(index, true);
        if (numAdjacentMines === 0) return this.openMultiple(index, playSounds);

        cell.reveal(numAdjacentMines);
    };

    this.openMultiple = (index, playSounds) => {
        if (playSounds) sounds.play("multiple_correct");
        if (playSounds) this.onCascade();
        getAdjacentCells(index).forEach((i, numIteration) => {
            setTimeout(
                () => clickHandler(cellsArray[i], false), // false == don't play click sound
                numIteration * obj.msBetweenBlastCircles ?? 10
            ); // hardcoded!
        });
        return true;
    }

    function layMines(cellToAvoidMining) {
        while (minesArray.length < numMines) {
            const rand = Math.floor(Math.random() * numCells);
            if (!minesArray.includes(rand) && rand !== cellToAvoidMining)
                minesArray.push(rand);
        }
    }

    function getAdjacentCells(a) {
        let array = [];
        for (let i = 0; i < cellsArray.length; i++)
            if (areAdjacentCells(a, i)) array.push(i);
        return array;
    }

    function areAdjacentCells(a, b) {
        const areNotSameCell = a !== b;
        const areAdjacentRows =
            Math.abs(
                Math.floor(a / cellsPerRow) - Math.floor(b / cellsPerRow)
            ) <= 1;
        const areAdjacentColumns =
            Math.abs((a % cellsPerRow) - (b % cellsPerRow)) <= 1;
        return areNotSameCell && areAdjacentRows && areAdjacentColumns;
    }

    function getNumAdjacentMines(c) {
        return getAdjacentCells(c).filter(i => minesArray.includes(i)).length;
    }

    function getNumRemainingEmptyLeft() {
        return numCells - clickedArray.length - numMines;
    }

    function moveToArrayFront(array, element) {
        array.splice(array.indexOf(element), 1);
        array.unshift(element);
        return true;
    }
}

function NumLeftDisplay(obj = {}) {
    const display = document.querySelector(
        obj.displayId ?? "#num-left-display"
    );

    this.getPercentCompleted = () => undefined;
    this.getScore = () => undefined;

    this.update = () => {
        display.innerHTML = this.getScore();
        document.querySelector("#scorebar").style.width =
            this.getPercentCompleted() + "%";
    };
}

const controller = new MinesweeperController(
    BackgroundImage,
    Clock,
    LevelSelect,
    FlagMode,
    MuteButton,
    Explosions,
    PauseButton,
    EventCounter,
);
function MinesweeperController(
    BackgroundImage,
    Clock,
    LevelSelect,
    FlagMode,
    MuteButton,
    Explosions,
    PauseButton,
    EventCounter
) {

    window.addEventListener("keyup", () => body.classList.contains("gameover") && newGame());

    const flagMode = new FlagMode();
    const playAgainButton = document.querySelector("#play-again-button");
    const muteButton = new MuteButton("#mute-button");
    const pauseButton = new PauseButton(".pause-button");
    const backgroundImage = new BackgroundImage();
    const balloonCelebration = new BalloonCelebration();
    const clock = new Clock({ display: document.querySelector("#timer-holder") });
    const explosions = new Explosions();
    const levelSelect = new LevelSelect();
    const numLeftDisplay = new NumLeftDisplay();
    const clickCounter = new EventCounter();
    const cascadeCounter = new EventCounter();
    const sounds = new Sounds({
        tick: "sounds/tick.mp3",
        explosion: "sounds/explosion.mp3",
        multiple_correct: "sounds/multiple_correct.mp3",
        tada: "sounds/tada.mp3"
    });
    const minefield = new Minefield(sounds, explosions, flagMode);

    playAgainButton.onclick = newGame;
    fitInParent($(playAgainButton));

    muteButton.isActive = () => minefield.isActive;
    window.addEventListener("keydown", e => e.key.toLowerCase() === "s" && muteButton.toggle());

    sounds.isMuted = () => muteButton.isMuted();

    pauseButton.onChangePausedState = isPaused => {
        isPaused ? clock.pause() : clock.start();
    };
    pauseButton.isActive = () => minefield.isActive;
    pauseButton.toggleOnKey = "p";

    numLeftDisplay.getScore = () => minefield.getScore();
    numLeftDisplay.getPercentCompleted = () => minefield.getPercentCompleted();

    levelSelect.onChange = newGame;

    minefield.onClick = () => {
        if (!minefield.isActive) return false;
        clock.start();
        numLeftDisplay.update();
    };
    minefield.getSettings = () => levelSelect.getSettings();
    minefield.endSequence = (indexOfClickedCell, didWin) => {
        minefield.isActive = false;
        minefield.hideFlags();
        flagMode.deactivate();
        clock.pause();
        body.classList.add("gameover", didWin ? "victory" : "defeat");
        // log(cascadeCounter.getNumEvents(), cascadeCounter.getAverage());
        return (didWin ? victorySequence : defeatSequence)(indexOfClickedCell);
    };
    minefield.onCellOpen = () => clickCounter.markEvent();
    minefield.onCascade = () => cascadeCounter.markEvent();

    function victorySequence() {
        body.classList.add("show-play-again-button");
        sounds.play("tada");
        balloonCelebration.new();
        return false;
    }

    function defeatSequence(index) {
        sounds.play("explosion");
        minefield.showMines({
            index,
            onFinish: () => body.classList.add("show-play-again-button")
        });
        return false;
    }

    function newGame() {
        balloonCelebration.clear();
        explosions.clear();
        clock.clear();
        sounds.stopAll();
        backgroundImage.rotate();
        flagMode.deactivate();
        body.classList.remove(
            "victory",
            "defeat",
            "gameover",
            "show-play-again-button"
        );
        minefield.buildTable();
        numLeftDisplay.update();
        window.dispatchEvent(new Event("resize"));
    }

    document.querySelector("#start-button").onclick = newGame;
    newGame();
}
