import "../js/jquery.js";


/*
    NOTE need to use jQuery here, because the window resize event
    seems not to work in straight javascript
*/

const log = console.log;


function fitInParent(child, obj = {}) {


    const $child = child instanceof $ ? child : $(child);
    const $parent = obj.parent ?? $child.parent();
    const maxWidth = obj.maxWidthFill ?? 1;
    const maxHeight = obj.maxHeightFill ?? 1;


    $(window).on("resize", () => {
        const widthDifference = ($parent.width() / $child.width()) * maxWidth;
        const heightDifference = ($parent.height() / $child.height()) * maxHeight;
        const scale = Math.min(widthDifference, heightDifference);
        $child.css("transform", `scale(${scale}, ${scale})`);
    }).trigger("resize");
}


export { fitInParent };
