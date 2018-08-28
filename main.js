let zip = new JSZip();
let check = false;
let files = [];

function allowDownload(newData) {
    document.querySelector('[id="download"]').addEventListener('click', event => {
        newData.forEach((element, i) => {
            zip.file(`males(${i + 1}).csv`, d3.csvFormat(element.males));
            zip.file(`females(${i + 1}).csv`, d3.csvFormat(element.females));
        });
        zip.generateAsync({
            type: 'blob'
        }).then(blob => {
            saveAs(blob, 'mapleTACSV.zip');
            newData = [];
            document.getElementById('convert').disabled = false;
            document.getElementById('convert').style.display = 'block';
            document.querySelector('[id="download"]').disabled = true;
            document.querySelector('[id="download"]').style.display = 'none';
            document.querySelector('ol').innerHTML = '';
            check = false;
        });
    });
    document.getElementById('convert').disabled = true;
    document.getElementById('convert').style.display = 'none';
    document.querySelector('[id="download"]').disabled = false;
    document.querySelector('[id="download"]').style.display = 'inline-block';
}

function modifyCSV(files) {
    document.getElementById('loader').style.display = 'block';
    let newData = [];
    files.forEach((file, i) => {

    });
    window.setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        allowDownload(newData);
    }, Math.floor(Math.random() * 5 * 1000 + 1000));

}

function removeDragData(event) {

    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to remove the drag data
        event.dataTransfer.items.clear();
    } else {
        // Use DataTransfer interface to remove the drag data
        event.dataTransfer.clearData();
    }
}

function validateCSV(data) {
    /* TODO: Validate the CSV file before modifying it.
     This will help generate less errors. It will also make sure
     users are uploading correctly formatted CSV files */
    return data.match(/^id,first_name,last_name,email,gender,ip_address/);
}


document.getElementById('drop_zone').addEventListener('drop', event => {
    event.preventDefault();
    if (!check) {
        document.querySelector('[id="download"]').disabled = true;
        document.querySelector('[id="download"]').style.display = 'none';
        if (event.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (var i = 0; i < event.dataTransfer.items.length; i++) {
                // If dropped items aren't files, reject them
                if (event.dataTransfer.items[i].kind === 'file') {
                    let file = event.dataTransfer.items[i].getAsFile();
                    if (file.name.match(/.csv$/)) {
                        let reader = new FileReader();
                        reader.onload = (event) => {
                            if (validateCSV(event.target.result)) {
                                files.push(d3.csvParse(event.target.result));
                                let listItem = document.createElement('li');
                                let node = document.createTextNode(file.name);
                                listItem.appendChild(node);
                                document.querySelector('ol').appendChild(listItem);
                            } else {
                                let listItem = document.createElement('li');
                                let node = document.createTextNode(file.name);
                                listItem.appendChild(node);
                                document.getElementById('invalid').appendChild(listItem);
                                document.getElementById('invalid_zone').style.display = 'block';
                            }
                        };
                        reader.readAsText(file);
                    } else {
                        console.log('unsupported file type!');
                    }
                }
            }
        } else {
            return;
        }

        // Pass event to removeDragData for cleanup
        removeDragData(event);
    }
});

document.getElementById('drop_zone').addEventListener('dragover', event => {
    event.preventDefault();
});

document.getElementById('convert').addEventListener('click', event => {
    if (files.length > 0) {
        check = true;
        modifyCSV(files);
    } else {
        alert('Please add at least one valid CSV file');
    }
});

document.getElementById('reset').addEventListener('click', event => {
    window.location.reload();
});

// Things to do as soon as the window loads
window.addEventListener('load', event => {
    document.querySelector('[id="download"]').disabled = true;
});