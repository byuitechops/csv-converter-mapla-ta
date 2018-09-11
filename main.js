let zip = new JSZip();
let check = false;
let files = [];
let invalidFiles = [];
let validRowCount = 0;
let invalidRowCount = 0;
let downloadButton = document.querySelector('[id="download"]');
let convertButton = document.getElementById('convert');
let dropText = document.getElementById('dropText');
let newData = [];

downloadButton.addEventListener('click', event => {
    newData.forEach((element, i) => {
        zip.file(element.fileName, d3.csvFormat(element.data));
    });
    zip.generateAsync({
        type: 'blob'
    }).then(blob => {
        saveAs(blob, 'canvasCSV.zip');
        newData = [];
        files = [];
        convertButton.classList.add('disabled');
        convertButton.style.display = 'inline-block';
        downloadButton.disabled = true;
        downloadButton.style.display = 'none';
        document.getElementById('valid').innerHTML = '';
        dropText.innerHTML = 'Drag and Drop CSV Files Here';
        check = false;
    }, err => {
        console.error(err);
        alert('There was an error downloading the zip file containing the CSVs');
    });
});

function allowDownload() {
    convertButton.style.display = 'none';
    downloadButton.disabled = false;
    downloadButton.style.display = 'inline-block';
    dropText.innerHTML = 'Canvas CSV Download Ready';
}

function modifyCSV(files) {
    let content = document.getElementById('content');
    let loader = document.getElementById('loader');
    invalidFiles = [];
    content.style.display = 'none';
    document.getElementById('invalid_zone').style.display = 'none';
    document.getElementById('invalid').innerHTML = '';
    loader.style.display = 'inline-block';
    files.forEach((file, i) => {
        newData.push({
            fileName: file.fileName,
            data: []
        });
        file.data.forEach(student => {
            let assignment = Object.keys(student)[4];
            if (student[''] !== 'Total Points') {
                newData[i].data.push({
                    Student: `${student.Last}, ${student.Given}`,
                    'Student ID': student['Student ID'],
                    Section: '',
                    [assignment]: student[assignment]
                });
            }
        });
    });
    window.setTimeout(() => {
        loader.style.display = 'none';
        content.style.display = 'block';
        allowDownload();
    }, Math.floor(Math.random() * 2 * 1000 + 1000));
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

function validateCSV(data) {
    return data.match(/,Last,Given,Student ID,.+?,Total/);
}

function makeValidatedTable(file) {
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
}

function makeInvalidTable(file) {
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

document.getElementById('file').addEventListener('change', event => {
    let files = Array.from(event.target.files);
    files.forEach(file => {
        let fileReader = new FileReader();
        fileReader.onload = (event) => {
            if (checkDuplicates(file.name)) {
                return;
            }
            event.target.result = event.target.result.replace(/\ufeff/g, '');
            if (validateCSV(event.target.result)) {
                convertButton.classList.remove('disabled');
                files.push({
                    fileName: file.name,
                    data: d3.csvParse(event.target.result)
                });
                makeValidatedTable(file);
            } else {
                invalidFiles.push(file.name);
                makeInvalidTable(file);
            }
        };
        fileReader.readAsText(file);
    });
});

document.getElementById('drop_zone').addEventListener('drop', event => {
    event.preventDefault();
    if (!check) {
        let downloadButton = document.querySelector('[id="download"]');
        let convertButton = document.getElementById('convert');
        downloadButton.disabled = true;
        downloadButton.style.display = 'none';
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
                            event.target.result = event.target.result.replace(/\ufeff/g, '');
                            if (validateCSV(event.target.result)) {
                                convertButton.classList.remove('disabled');
                                files.push({
                                    fileName: file.name,
                                    data: d3.csvParse(event.target.result)
                                });
                                makeValidatedTable(file);
                            } else {
                                invalidFiles.push(file.name);
                                makeInvalidTable(file);
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