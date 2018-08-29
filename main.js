let zip = new JSZip();
let check = false;
let files = [];
let invalidFiles = [];
let validRowCount = 0;
let invalidRowCount = 0;

function allowDownload(newData) {
    document.querySelector('[id="download"]').addEventListener('click', event => {
        console.log(newData);
        newData.forEach((element, i) => {
            zip.file(`males(${i + 1}).csv`, d3.csvFormat(element.males));
            zip.file(`females(${i + 1}).csv`, d3.csvFormat(element.females));
        });
        zip.generateAsync({
            type: 'blob'
        }).then(blob => {
            saveAs(blob, 'mapleTACSV.zip');
            newData = [];
            files = [];
            document.getElementById('convert').classList.add('disabled');
            document.getElementById('convert').style.display = 'inline-block';
            document.querySelector('[id="download"]').disabled = true;
            document.querySelector('[id="download"]').style.display = 'none';
            document.getElementById('valid').innerHTML = '';
            check = false;
        });
    });
    document.getElementById('convert').disabled = true;
    document.getElementById('convert').style.display = 'none';
    document.querySelector('[id="download"]').disabled = false;
    document.querySelector('[id="download"]').style.display = 'inline-block';
}

function modifyCSV(files) {
    invalidFiles = [];
    document.getElementById('content').style.display = 'none';
    document.getElementById('invalid_zone').style.display = 'none';
    document.getElementById('invalid').innerHTML = '';
    document.getElementById('loader').style.display = 'inline-block';
    let newData = [];
    files.forEach((file, i) => {

    });
    window.setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('content').style.display = 'block';
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

function checkDuplicates(fileName) {
    if (invalidFiles.find(file => {
        return fileName === file;
    })) {
        // The user is trying to upload a file that has already been uploaded. Stop them.
        return true;
    }
    if (files.find(file => {
        return fileName === file.fileName;
    })) {
        // The user is trying to upload a file that has already been uploaded. Stop them.
        return true;
    }
    return false;
}

/* TODO: Validate the CSV file before modifying it.
     This will help generate less errors. It will also make sure
     users are uploading correctly formatted CSV files */
function validateCSV(data) {
    return data.match(/^id,first_name,last_name,email,gender,ip_address/);
}


document.getElementById('drop_zone').addEventListener('drop', event => {
    event.preventDefault();
    if (!check) {
        document.querySelector('[id="download"]').disabled = true;
        document.querySelector('[id="download"]').style.display = 'none';
        if (event.dataTransfer.items) {
            // Use DataTransferItemList interface to access the file(s)
            for (let i = 0; i < event.dataTransfer.items.length; i++) {
                // If dropped items aren't files, reject them
                if (event.dataTransfer.items[i].kind === 'file') {
                    let file = event.dataTransfer.items[i].getAsFile();
                    if (file.name.match(/.csv$/)) {
                        let reader = new FileReader();
                        reader.onload = (event) => {
                            if (checkDuplicates(file.name)) {
                                return;
                            }
                            if (validateCSV(event.target.result)) {
                                document.getElementById('convert').classList.remove('disabled');
                                files.push({
                                    fileName: file.name,
                                    data: d3.csvParse(event.target.result)
                                });
                                if (files.length % 5 === 1 || validRowCount === 0) {
                                    validRowCount++;
                                    let tableRow = document.createElement('tr');
                                    tableRow.id = `row${validRowCount}`;
                                    document.getElementById('valid').appendChild(tableRow);

                                }
                                let tableData = document.createElement('td');
                                let node = document.createTextNode(file.name);
                                tableData.appendChild(node);
                                document.getElementById(`row${validRowCount}`).appendChild(tableData);
                            } else {
                                invalidFiles.push(file.name);
                                if (invalidFiles.length % 5 === 1 || invalidRowCount === 0) {
                                    invalidRowCount++;
                                    let tableRow = document.createElement('tr');
                                    tableRow.id = `invRow${invalidRowCount}`;
                                    document.getElementById('invalid').appendChild(tableRow);
                                }
                                let tableData = document.createElement('td');
                                let node = document.createTextNode(file.name);
                                tableData.appendChild(node);
                                document.getElementById(`invRow${invalidRowCount}`).appendChild(tableData);
                                document.getElementById('invalid_zone').style.display = 'block';
                            }
                        };
                        reader.readAsText(file);
                    } else {
                        console.log('Unsupported file type!');
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

window.addEventListener('dragover', event => {
    event.preventDefault();
});

window.addEventListener('drop', event => {
    event.preventDefault();
});

document.getElementById('convert').addEventListener('click', event => {
    if (files.length > 0) {
        check = true;
        modifyCSV(files);
    }
});

document.getElementById('reset').addEventListener('click', event => {
    window.location.reload();
});