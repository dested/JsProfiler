var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    lineNumbers: true,
    gutters: ["CodeMirror-linenumbers", "hits", "breakpoints"]
});

function error(msg) {
    document.getElementById('errors').innerHTML = msg;
}


function getHighResTimer(code, callback) {

    $.ajax({
        url: "http://198.211.107.101:1000/getTimer",
        type: "POST",
        data: code,
        dataType: "text",
        contentType: "text/plain;charset=UTF-8",
        success: function (data) {
            data = JSON.parse(data);

            for (var line in data.times) {
                if (data.times.hasOwnProperty(line)) {
                    data.times[line] = data.times[line] / 1000000;

                }

            }
            callback(data);
        }
    });

}



function getTimer(code, callback) {

    var instrumenter = new Instrumenter({
        noCompact: true,
        debug: true
    });
    var timeIt;
    try {
        var changed;
        changed = instrumenter.instrumentSync(code, 'filename.js');

        changed = '(function(){' + changed + ';return timeMe})()';


        timeIt = eval(changed);

    } catch (exc) {
        error(exc.stack);
        console.log(changed);
        return;
    }



    var timer;

    try {
        timer = timeIt();

    } catch (exc) {
        error(exc.stack);
        return;
    }
    callback(timer);
}

function doTimer(local) {
    var code = editor.getValue();


    (local ? getTimer : getHighResTimer)(code, function (timer) {


        editor.clearGutter("breakpoints");
        editor.clearGutter("hits");
        for (var times in timer.statementMap) {
            if (timer.statementMap.hasOwnProperty(times)) {
                var statement = timer.statementMap[times];
                var lineNumber = statement.start.line - 1;

                var info = editor.lineInfo(lineNumber);

                var totalTime = timer.times[times];
                var totalHits = timer.hits[times];

                if (info.gutterMarkers) {
                    totalTime += parseFloat(info.gutterMarkers["breakpoints"].innerText);
                    totalHits += parseFloat(info.gutterMarkers["hits"].innerText);
                    debugger;
                }

                if (timer.times[times] !== undefined) {

                    editor.setGutterMarker(lineNumber, "breakpoints", makeTimeMarker(totalTime));
                    editor.setGutterMarker(lineNumber, "hits", makeHitMarker(totalHits));
                }
            }
        }
    });


}

function makeTimeMarker(time) {
    var marker = document.createElement("div");
    marker.style.color = "#822";
    marker.innerHTML = time.toFixed(3) + 'ms';
    return marker;
}

function makeHitMarker(hits) {
    var marker = document.createElement("div");
    marker.style.color = "#228";
    if (hits == 1) {
        marker.innerHTML = hits.toFixed(0) + ' hit';
    } else {
        marker.innerHTML = hits.toFixed(0) + ' hits';
    }
    return marker;
}