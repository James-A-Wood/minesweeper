
function Clock(settings = {}) {

    const display = settings.display; // required
    const showMiliseconds = settings.showMiliseconds;

    let t1 = Date.now(),
        isRunning,
        totalElapsedMs = 0,
        secondCounter = 0;

    const pad = n => n.toString().length === 1 ? "0" + n : n;

    function getFormattedTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const displaySeconds = totalSeconds % 60;
        const totalMinutes = Math.floor(totalSeconds / 60);
        return totalMinutes + ":" + pad(displaySeconds);
    }

    function getDisplayText() {
        let text = getFormattedTime(totalElapsedMs);
        if (showMiliseconds) text += "." + t.displayMs;
        return text;
    }

    const changeRunningState = val => {
        isRunning = val ? val : !isRunning;
        this.onChangeRunningState(isRunning);
        return this;
    };

    this.clear = () => {
        totalElapsedMs = 0;
        display.textContent = "0:00";
        return changeRunningState(false);
    };
    this.getElapsedTimeRaw = () => totalElapsedMs;
    this.getElapsedTimeFormatted = () => getFormattedTime(totalElapsedMs);
    this.onChangeRunningState = () => undefined;
    this.pause = () => changeRunningState(false);
    this.start = () => changeRunningState(true);

    function eachSecond() {
        secondCounter -= 1000;
        display.textContent = getDisplayText();
    }

    const addElapsedTime = t => {
        totalElapsedMs += t;
        secondCounter += t;
        if (secondCounter > 1000) eachSecond();
    };

    function tick() {
        const t2 = Date.now();
        if (isRunning) addElapsedTime(t2 - t1);
        t1 = t2;
        window.requestAnimationFrame(tick);
    }
    tick();
}

export { Clock };
