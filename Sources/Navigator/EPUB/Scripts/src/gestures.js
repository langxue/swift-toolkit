//
//  Copyright 2025 Readium Foundation. All rights reserved.
//  Use of this source code is governed by the BSD-style license
//  available in the top-level LICENSE file of the project.
//

import { handleDecorationClickEvent } from "./decorator";
import { adjustPointToViewport } from "./rect";
import { findNearestInteractiveElement } from "./dom";


let singleClickCount = 0;
let doubleClickCount = 0;

let clickTimer = null;
const delay = 300;

window.addEventListener("DOMContentLoaded", function () {
  // If we don't set the CSS cursor property to pointer, then the click events are not triggered pre-iOS 13.
  document.body.style.cursor = "pointer";

  document.addEventListener("click", onClick, false);
});

function onClick(event) {
    if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
        handleDoubleClick(event);
        return;
    }
    
    clickTimer = setTimeout(function() {
        clickTimer = null;
        handleSingleClick(event);
    }, delay);
}

function handleDoubleClick(event){
//    console.log("db click!!!!!")
    if (event.target.tagName.toLowerCase() === 'p' || event.target.tagName.toLowerCase() === 'span') {
        const range = document.createRange();
        
        const textNodes = [];
        const walk = document.createTreeWalker(
            event.target,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walk.nextNode()) {
            if (!node.parentNode.closest('sup')) {
                textNodes.push(node);
            }
        }
        
        if (textNodes.length > 0) {
            range.setStart(textNodes[0], 0);
            range.setEnd(textNodes[textNodes.length - 1], textNodes[textNodes.length - 1].length);
            
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
        
        let group = readium.getDecorations('highlights');
        group.remove(group.tempSelectId);
        group.addWithRange(group.selectHighlightStyle(group.tempSelectId), range);
        
//        const selection = window.getSelection();
//        selection.removeAllRanges();
//        selection.addRange(range);

//        webkit.messageHandlers.selectionChanged.postMessage(getCurrentSelection());

//        webkit.messageHandlers.tap.postMessage(clickEvent);
    }
}


function handleSingleClick(event){
    let group = readium.getDecorations('highlights');
    group.remove(group.tempSelectId);
    
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
