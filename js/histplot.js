function setplot(listdata, div, title) {
    const container = document.getElementById(div);
    const plotWidth = Math.max(container.clientWidth || 700, 320);
    let trace = {
        x: listdata,
        name: 'Raw data',
        type: 'histogram',
        opacity: 0.8,
        marker: {
            color: 'rgb(55,198,192)'
        }
    };
    let layout = {
        title: title,
        width: plotWidth,
        height: 420,
        margin: {
            l: 56,
            r: 24,
            t: 64,
            b: 56
        },
        xaxis: {title: 'Period / day'},
        yaxis: {title: 'Count'}
    };
    let data = [trace];
    Plotly.newPlot(container, data, layout, {
        displayModeBar: false,
        responsive: true
    }).then(function() {
        requestAnimationFrame(function() {
            Plotly.Plots.resize(container);
        });
    });
}

function histplot(filepath, div, title) {
    $.get(filepath, function(listdata) {
        let jsondata = JSON.parse(listdata);
        setplot(jsondata.data, div, title);
    });
}
