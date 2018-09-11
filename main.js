let zip = new JSZip();
let check = false;
let files = [];
let invalidFiles = [];
let validRowCount = 0;
let invalidRowCount = 0;
let downloadButton = document.querySelector('[id="download"]');
let convertButton = document.getElementById('convert');
let chooseFiles = document.getElementById('choose_files');
let dropText = document.getElementById('dropText');
let newData = [];

/***************************************************
 *                   allowDownload()
 * 
 * Displays the download button which allows
 * the user to download a zip file containing the
 * converted CSV files. This function should only
 * be called once the data has been converted.
 * 
 * 
 * Return Type: void
 ***************************************************/
function allowDownload() {
    convertButton.style.display = 'none';
    downloadButton.disabled = false;
    downloadButton.style.display = 'inline-block';
    dropText.innerHTML = 'Canvas CSV Download Ready';
}

/***************************************************
 *                    modifyCSV()
 * 
 * Modifies the data to conform to Canvas standards.
 * While converting, the function makes a loading
 * wheel appear. The modified data is stored in the
 * newData array.
 * 
 * 
 * Return Type: void
 ***************************************************/
function modifyCSV(files) {
    let content = document.getElementById('content');
    let loader = document.getElementById('loader');
    invalidFiles = [];
    content.style.display = 'none';
    chooseFiles.style.display = 'none';
    document.getElementById('invalid_zone').style.display = 'none';
    document.getElementById('invalid').innerHTML = '';
    loader.style.display = 'inline-block';
    files.forEach((file, i) => {
        newData.push({
            fileName: file.fileName,
            data: []
        });
        file.data.forEach(student => {
            let assignments = Object.keys(student);
            let numKeys = assignments.length;
            assignments = assignments.slice(4, numKeys - 1);
            if (student[''] !== 'Total Points') {
                let newStudent = {
                    Student: `${student.Last}, ${student.Given}`,
                    'Student ID': student['Student ID'],
                    Section: ''
                };
                assignments.forEach(assignment => {
                    newStudent[assignment] = student[assignment];
                });
                newData[i].data.push(newStudent);
            }
        });
    });
    /* This function runs instantaniously, however to give the impression
    of conversion a loader will appear on the screen for 1-2 seconds. Then
    the download will be allowed.
    */
    window.setTimeout(() => {
        loader.style.display = 'none';
        content.style.display = 'block';
        allowDownload();
    }, Math.floor(Math.random() * 2 * 1000 + 1000));
}

/***************************************************
 *                 removeDragData()
 * 
 * Clears any leftover data from the user dragging
 * and dropping files.
 * 
 * Return Type: void
 ***************************************************/
function removeDragData(event) {
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to remove the drag data
        event.dataTransfer.items.clear();
    } else {
        // Use DataTransfer interface to remove the drag data
        event.dataTransfer.clearData();
    }
}

/***************************************************
 *                 checkForDuplicates()
 * 
 * Checks if the user is uploading a file that has
 * already been uploaded.
 * 
 * Return Type: bool
 ***************************************************/
function checkForDuplicates(fileName) {
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

/***************************************************
 *                 validateCSV()
 * 
 * Validates the CSV file. The regEx should match
 * the column headers of the file. Note: Columns
 * that are static can be hard coded while columns
 * that are dynamic, I.E assignment names, need to
 * be accounted for.
 * 
 * Return Type: Array/null
 ***************************************************/
function validateCSV(data) {
    return data.match(/,Last,Given,Student ID,.+?,Total/);
}

/***************************************************
 *                makeValidTable()
 * 
 * Creates/Modifies the valid CSV table. This
 * function is called when a file validates.
 * 
 * Return Type: void
 ***************************************************/
function makeValidTable(file) {
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

/***************************************************
 *                makeInvalidTable()
 * 
 * Creates/Modifies the invalid CSV table. This
 * function is called when a file fails to validate.
 * 
 * Return Type: void
 ***************************************************/
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

/* -- Event Listeners -- */

/***************************************************
 *             Download Button Listener
 * 
 * This listener's purpose is to run once the
 * the download is ready and the user clicks the 
 * download button. The function puts each converted
 * file into a single zipped folder. Once each file
 * has been placed the download starts.  
 ***************************************************/
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
        chooseFiles.style.display = 'block';
        document.getElementById('valid').innerHTML = '';
        dropText.innerHTML = 'Drag and Drop CSV Files Here';
        check = false;
    }, err => {
        console.error(err);
        alert('There was an error downloading the zip file containing the CSVs');
    });
});

/***************************************************
 *            Choose File Button Listener
 * 
 * This listener's purpose is to run once the user
 * has selected files from their file explorer. The
 * function checks for duplicates and validates each
 * file. Once a file validates the file is pushed 
 * to the files array. 
 ***************************************************/
document.getElementById('file').addEventListener('change', event => {
    let tempFiles = Array.from(event.target.files);
    tempFiles.forEach(file => {
        let fileReader = new FileReader();
        fileReader.onload = (event) => {
            if (checkForDuplicates(file.name)) {
                return;
            }
            event.target.result = event.target.result.replace(/\ufeff/g, '');
            if (validateCSV(event.target.result)) {
                convertButton.classList.remove('disabled');
                files.push({
                    fileName: file.name,
                    data: d3.csvParse(event.target.result)
                });
                makeValidTable(file);
            } else {
                invalidFiles.push(file.name);
                makeInvalidTable(file);
            }
        };
        fileReader.readAsText(file);
    });
});

/***************************************************
 *         Drop Zone Drag and Drop Listener
 * 
 * This listener's purpose is to run once the user
 * drops files into the drop zone. The function 
 * checks for duplicates and validates each file. 
 * Once a file validates the file is pushed onto the
 * files array. 
 ***************************************************/
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
                            if (checkForDuplicates(file.name)) {
                                return;
                            }
                            event.target.result = event.target.result.replace(/\ufeff/g, '');
                            if (validateCSV(event.target.result)) {
                                convertButton.classList.remove('disabled');
                                files.push({
                                    fileName: file.name,
                                    data: d3.csvParse(event.target.result)
                                });
                                makeValidTable(file);
                            } else {
                                invalidFiles.push(file.name);
                                makeInvalidTable(file);
                            }
                        };
                        reader.readAsText(file);
                    } else {
                        console.error('Unsupported file type!');
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

// Prevents a file from executing its default action (Download or open in browser)
window.addEventListener('dragover', event => {
    event.preventDefault();
});

// Prevents a file from executing its default action (Download or open in browser)
window.addEventListener('drop', event => {
    event.preventDefault();
});

// Checks if the files array's length is greater than 0 before allowing the modifyCSV function to run 
document.getElementById('convert').addEventListener('click', event => {
    if (files.length > 0) {
        check = true;
        modifyCSV(files);
    }
});

// Resets the page by refreshing it. Note: This could break is the user loses connection
document.getElementById('reset').addEventListener('click', event => {
    window.location.reload();
});