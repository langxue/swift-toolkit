//
//  Copyright 2025 Readium Foundation. All rights reserved.
//  Use of this source code is governed by the BSD-style license
//  available in the top-level LICENSE file of the project.
//

import { handleDecorationClickEvent } from "./decorator";
import { adjustPointToViewport } from "./rect";
import { findNearestInteractiveElement } from "./dom";


// 单击和双击计数器
let singleClickCount = 0;
let doubleClickCount = 0;

let clickTimer = null;
const delay = 300; // 双击检测的延迟时间（毫秒）

window.addEventListener("DOMContentLoaded", function () {
  // If we don't set the CSS cursor property to pointer, then the click events are not triggered pre-iOS 13.
  document.body.style.cursor = "pointer";

  document.addEventListener("click", onClick, false);
});

function onClick(event) {
    // 清除之前的计时器
    if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        // 如果已经有计时器，说明是双击
        handleDoubleClick(event);
        return;
    }
    
    // 设置新的计时器延迟执行单击事件
    clickTimer = setTimeout(function() {
        clickTimer = null;
        handleSingleClick(event);
    }, delay);
}

function handleDoubleClick(event){
    console.log("db click!!!!!")
    if (event.target.tagName.toLowerCase() === 'p' || event.target.tagName.toLowerCase() === 'span') {
        const range = document.createRange();
        range.selectNodeContents(event.target);
//        const selection = window.getSelection();
//        selection.removeAllRanges();
//        selection.addRange(range);
        let group = readium.getDecorations('highlights');
        group.addWithRange(group.selectHighlightStyle("88888"), range);
    }
}


function handleSingleClick(event){
    let group = readium.getDecorations('highlights');
    group.remove("88888");
    
    if (!getSelection().isCollapsed) {
      // There's an on-going selection, the tap will dismiss it so we don't forward it.
      return;
    }

    let point = adjustPointToViewport({ x: event.clientX, y: event.clientY });
    let clickEvent = {
      defaultPrevented: event.defaultPrevented,
      x: point.x,
      y: point.y,
      targetElement: event.target.outerHTML,
      interactiveElement: findNearestInteractiveElement(event.target),
    };

    if (handleDecorationClickEvent(event, clickEvent)) {
      return;
    }

    // Send the tap data over the JS bridge even if it's been handled
    // within the webview, so that it can be preserved and used
    // by the WKNavigationDelegate if needed.
    webkit.messageHandlers.tap.postMessage(clickEvent);

    // We don't want to disable the default WebView behavior as it breaks some features without bringing any value.
    // event.stopPropagation();
    // event.preventDefault();
}
