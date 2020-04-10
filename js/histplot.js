function setplot(listdata, div, title) {
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
        xaxis: {title: 'Period / day'},
        yaxis: {title: 'Count'}
    };
    let data = [trace];
    Plotly.newPlot(div, data, layout);
}

function histplot(filepath, div, title) {
    $.get(filepath, function(listdata) {
        let jsondata = JSON.parse(listdata);
        setplot(jsondata.data,div, title);
    });
}
