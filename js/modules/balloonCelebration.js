

import '/minesweeper/js/konva.js';


const log = console.log;
const body = document.querySelector("body");


function BalloonCelebration(settings = {}) {

    settings.numBalloons = settings.numBalloons ?? 50;
    settings.duration = settings.duration ?? 4;
    settings.rotation = settings.rotation ?? 60;
    settings.image = settings.image ?? "/minesweeper/images/balloon.png";
    settings.swayDuration = settings.swayDuration ?? 1;
    settings.balloonReleaseDuration = settings.balloonReleaseDuration ?? 2000;

    const tweensArray = []; // so we can destroy them
    const releaseInterval = settings.balloonReleaseDuration / settings.numBalloons;

    let balloonHolderDiv, stage, layer;

    ["keyup", "keydown"].forEach(event => window.addEventListener(event, this.clear));

    this.clear = () => {
        layer?.removeChildren();
        tweensArray.forEach(tween => tween?.destroy());
        balloonHolderDiv?.remove();
        ["keyup", "keydown"].forEach(event => window.removeEventListener(event, this.clear));
    };

    this.new = () => {
        prepareStage();
        Konva.Image.fromURL(settings.image, balloon => {
            balloon.width(balloon.width() / 10);
            balloon.height(balloon.height() / 10);
            for (let i = 0; i < settings.numBalloons; i++) {
                setTimeout(() => addBalloon(balloon, settings), i * releaseInterval);
            }
        });
    };


    const addBalloon = (balloon, settings) => {

        const newBalloon = balloon.clone().moveTo(layer).cache();
        const magnification = Math.random() + 0.5; // 0.5 ~ 1.5
        const rotation = (settings.rotation / 2) - Math.random() * settings.rotation;

        newBalloon.x(Math.random() * stage.width())
            .offsetX(newBalloon.width() / 2)
            .offsetY(newBalloon.height() / 2)
            .y(stage.height() + newBalloon.height() / 2)
            .rotation(rotation)
            .scale({ x: magnification, y: magnification, });

        // (1/2) tweening the balloon ascension first...
        const riseTween = new Konva.Tween({
            node: newBalloon,
            duration: settings.duration,
            y: -newBalloon.height() / 2,
            onFinish: () => {
                newBalloon.destroy();
                if (!layer.getChildren().length) this.clear();
            }
        }).play();
        tweensArray.push(riseTween);

        // (2/2) then separately tweening the balloon's swaying
        newBalloon.to({
            duration: settings.swayDuration,
            rotation: -newBalloon.rotation(),
            easing: Konva.Easings.EaseInOut,
            yoyo: true,
        });
    };

    const prepareStage = () => {

        balloonHolderDiv = document.createElement("div");
        balloonHolderDiv.style.position = "fixed";
        balloonHolderDiv.style.width = window.innerWidth + "px";
        balloonHolderDiv.style.height = window.innerHeight + "px";
        balloonHolderDiv.style.top = 0;
        balloonHolderDiv.style.left = 0;
        body.appendChild(balloonHolderDiv);

        stage = new Konva.Stage({
            container: balloonHolderDiv,
            width: balloonHolderDiv.offsetWidth,
            height: balloonHolderDiv.offsetHeight,
        });
        layer = new Konva.Layer();
        stage.add(layer).on("click tap", this.clear);
    };
}


export { BalloonCelebration };
