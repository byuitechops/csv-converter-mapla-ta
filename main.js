const headersToCheck = ['Last', 'Given', 'Student ID', 'Total'];
const headersToKeep = ['Student', 'Student ID', 'Section'];
const headersToDelete = ['', 'Last', 'Given', 'Total'];
const tableIDs = ['valid', 'invalid'];
let downloading,
    files,
    invalidFiles,
    newFiles,
    downloadButton = document.querySelector('[id="download"]'),
    convertButton = document.getElementById('convert'),
    chooseFiles = document.getElementById('choose_files'),
    dropText = document.getElementById('dropText'),
    dropZone = document.getElementById('drop_zone'),
    instructions = document.getElementById('instructions'),
    validZone = document.getElementById('valid_zone'),
    invalidZone = document.getElementById('invalid_zone');

/***************************************************
 *                    init()
 * 
 * Initializes the necessary global variables and
 * modifies some of the elements on the page. This
 * function is called when the page loads and
 * after the user clicks the download button.
 * 
 * Return Type: void
 ***************************************************/
function init() {
    newFiles = [];
    files = [];
    invalidFiles = [];
    // Reset the input file's value to blank
    document.getElementById('file').value = '';
    document.getElementsByClassName('browser-default')[0].style.display = 'block';
    validZone.style.display = 'block';
    dropZone.style.border = '1.5px solid black';
    dropText.innerHTML = 'Drag and Drop CSV Files Here';
    downloading = false;
    // Fix buttons for after downloading
    convertButton.style.display = 'inline-block';
    convertButton.classList.add('disabled');
    convertButton.classList.remove('pulse');
    downloadButton.disabled = true;
    downloadButton.style.display = 'none';
    chooseFiles.style.display = 'block';
}

/***************************************************
 *                    modifyCSV()
 * 
 * Modifies the data to conform to Canvas standards.
 * The modified data is stored in the newFiles array.
 * 
 * Return Type: void
 ***************************************************/
function modifyCSV() {
    files.forEach((file, i) => {
        newFiles.push({
            fileName: file.fileName,
            data: []
        });
        file.data.forEach(student => {
            if (student[''] !== 'Total Points') {
                student.Student = `${student.Last}, ${student.Given}`;
                student.Section = '';
                headersToDelete.forEach(header => {
                    delete student[header];
                });
                newFiles[i].data.push(student);
            }
        });
    });
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
    if (invalidFiles.some(file => fileName === file.fileName)) {
        // The user is trying to upload a file that has already been uploaded. Stop them.
        return true;
    }
    if (files.some(file => fileName === file.fileName)) {
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
 * Return Type: Array/null or bool
 ***************************************************/
function validateCSV(data) {
    // Check the CSV for the correct column headers
    if (headersToCheck.every(header => data.columns.includes(header))) {
        // Check each row for percentages on the grades
        return data.every(row => {
            // Skip the total points row. This doesn't need percentage validation
            if (!row['']) {
                let rowKeys = Object.keys(row);
                let startIndex = rowKeys.findIndex(key => key === 'Student ID') + 1;
                let keysToCheck = rowKeys.slice(startIndex, rowKeys.length - 1);
                return keysToCheck.every(key => row[key].match(/\d+%/) || row[key] === '');
            }
            return true;
        });
    }
    // CSV files doesn't have the correct column headers
    return false;
}

/***************************************************
 *                  addToTables()
 * 
 * Adds files to the valid or invalid table
 * depending on whether validation was passed.
 * 
 * Return Type: void
 ***************************************************/
function addToTables() {
    tableIDs.forEach(tableID => {
        let table = document.getElementById(tableID);
        table.innerHTML = '';
        let filesToAdd = [];
        if (tableID === 'valid') {
            filesToAdd = files;
        } else {
            filesToAdd = invalidFiles;
        }
        filesToAdd.forEach(file => {
            let lastRow = table.querySelector('tr:last-child');
            if (!lastRow || lastRow.children.length === 5) {
                lastRow = document.createElement('tr');
                table.appendChild(lastRow);
            }
            let tableData = document.createElement('td');
            let node;
            node = document.createTextNode(file.fileName);
            tableData.appendChild(node);
            lastRow.appendChild(tableData);
        });
    });
}

/***************************************************
 *                  fileOnLoad()
 * 
 * This function runs on each file that is
 * uploaded by the user. It calls the necessary
 * functions to determine if the file is accepted.
 * 
 * Return Type: void
 ***************************************************/
function fileOnLoad(event, fileName) {
    return new Promise((resolve, reject) => {
        if (checkForDuplicates(fileName)) {
            reject('Duplicate Found');
            return;
        }
        event.target.result = event.target.result.replace(/\ufeff/g, '');
        let data = d3.csvParse(event.target.result);
        if (validateCSV(data, event.target.result)) {
            convertButton.classList.remove('disabled');
            convertButton.classList.add('pulse');
            files.push({
                fileName,
                data
            });
            //addToTable(fileName, 'valid');
        } else {
            invalidFiles.push({
                fileName
            });
            //addToTable(fileName, 'invalid');
            document.getElementById('invalidMSG').innerHTML = `*Please check that each CSV file contains the following column headers: ${headersToCheck.join(', ')}. Also check that each grade is a percentage.`;
            invalidZone.style.display = 'block';
        }
        resolve();
    });
}

/***************************************************
 *           makeTheUserWaitForNoReason()
 * 
 * Since most CSV uploads convert almost instantly,
 * this function gives the user a sense that the
 * tool is converting the CSVs. Once the wait is
 * over, the function then allows the user to
 * download the files.
 *       
 * Return Type: void
 ***************************************************/
function makeTheUserWaitForNoReason() {
    let content = document.getElementById('content');
    let loader = document.getElementById('loader');
    content.style.display = 'none';
    loader.style.display = 'inline-block';
    window.setTimeout(() => {
        chooseFiles.style.display = 'none';
        invalidZone.style.display = 'none';
        validZone.style.display = 'none';
        // Reset the table text
        document.getElementById('valid').innerHTML = '';
        document.getElementById('invalid').innerHTML = '';
        document.getElementsByClassName('browser-default')[0].style.display = 'none';
        dropZone.style.border = 'none';
        instructions.style.display = 'block';
        loader.style.display = 'none';
        content.style.display = 'block';
        // Allow the download
        downloading = true;
        convertButton.style.display = 'none';
        downloadButton.disabled = false;
        downloadButton.style.display = 'inline-block';
        dropText.innerHTML = 'Canvas CSV Download Ready';
    }, Math.floor(Math.random() * 2 * 1000 + 1000));
}

/***************************************************
 *                   readFile()
 * 
 * Reads the files provided by the user. Once the
 * file is read and loaded this function calls the
 * fileOnLoad() function and then the callback. 
 *       
 * Return Type: void
 ***************************************************/
function readFile(file, callback) {
    let fileReader = new FileReader();
    fileReader.onload = (event) => {
        fileOnLoad(event, file.name).then(callback, (err) => {
            console.error(err);
            callback();
        });
    };
    fileReader.readAsText(file);
}

/***************************************************
 *                  sortFiles()
 * This function sorts the files and invalid files
 * into alphabetical order based on filename.
 *       
 * Return Type: void
 ***************************************************/
function sortFiles(file1, file2) {
    let filename1 = file1.fileName.toUpperCase();
    let filename2 = file2.fileName.toUpperCase();
    if (filename1 < filename2) {
        return -1;
    }
    if (filename1 > filename2) {
        return 1;
    }
    return 0;
}

/* -- Event Listeners -- */

/***************************************************
 *             Download Button Listener
 * 
 * This listener's purpose is to run once the
 * the download is ready and the user clicks the 
 * download button. The function puts each converted
 * file into a single zipped folder unless there is
 * only one file to be converted. Once each file
 * has been placed the download starts.  
 ***************************************************/
downloadButton.addEventListener('click', () => {
    // If the user is converting only 1 file, don't zip it
    if (newFiles.length === 1) {
        let soloFile = newFiles[0];
        let headers = headersToKeep.concat(Object.keys(soloFile.data[0]).filter(n => !headersToKeep.includes(n)));
        soloFile.fileName = soloFile.fileName.slice(0, soloFile.fileName.length - 4) + '(Canvas Ready).csv';
        download(d3.csvFormat(soloFile.data, headers), soloFile.fileName, 'text/plain');
        init();
    } else {
        let zip = new JSZip();
        let now = moment();
        newFiles.forEach((newFile) => {
            let headers = headersToKeep.concat(Object.keys(newFile.data[0]).filter(n => !headersToKeep.includes(n)));
            newFile.fileName = newFile.fileName.slice(0, newFile.fileName.length - 4) + '(Canvas Ready).csv';
            zip.file(newFile.fileName, d3.csvFormat(newFile.data, headers));
        });
        zip.generateAsync({
            type: 'blob'
        }).then(blob => {
            saveAs(blob, `CanvasReadyCSVs(${now.format('YYYY[Y]-MM[M]-DD[D]-hh[h]-mm[m]-SS[s]')}).zip`);
            init();
        }, err => {
            console.error(err);
            alert('There was an error downloading the zip file containing the CSVs');
        });
    }
});

/***************************************************
 *            Choose File Button Listener
 * 
 * This listener's purpose is to run once the user
 * has selected files from their file explorer. The
 * function uses an asynchronous each() to read in 
 * the files. Once they have been read in, the
 * function calls the sort(sortfiles) and 
 * addToTables() functions.
 ***************************************************/
document.getElementById('file').addEventListener('change', event => {
    let tempFiles = Array.from(event.target.files);
    async.each(tempFiles, readFile, err => {
        if (err) {
            console.error(err);
            return;
        }
        files = files.sort(sortFiles);
        invalidFiles = invalidFiles.sort(sortFiles);
        addToTables();
    });
});

/***************************************************
 *         Drop Zone Drag and Drop Listener
 * 
 * This listener's purpose is to run once the user
 * drops files into the drop zone. The
 * function uses an asynchronous each() to read in 
 * the files. Once they have been read in, the
 * function calls the sort(sortfiles) and 
 * addToTables() functions.
 ***************************************************/
document.getElementById('drop_zone').addEventListener('drop', event => {
    event.preventDefault();
    // If the user tries to drop files after converting, don't do anything
    if (downloading) return;
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        let items = Array.from(event.dataTransfer.items);
        let tempFiles = items.filter(item => {
            if (item.kind === 'file') {
                let file = item.getAsFile();
                return file.name.match(/.csv$/);
            }
        });
        tempFiles = tempFiles.map(item => item.getAsFile());
        async.each(tempFiles, readFile, err => {
            if (err) {
                console.error(err);
            } else {
                files = files.sort(sortFiles);
                invalidFiles = invalidFiles.sort();
                addToTables();
            }
        });
    }
    removeDragData(event);
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
document.getElementById('convert').addEventListener('click', () => {
    if (files.length > 0) {
        makeTheUserWaitForNoReason();
        modifyCSV();
    }
});

// Resets the page by refreshing it. Note: This could break is the user loses connection
document.getElementById('reset').addEventListener('click', () => {
    window.location.reload();
});

// Initializes the Materialize Modal
document.addEventListener('DOMContentLoaded', () => {
    var elems = document.querySelectorAll('.modal');
    var instances = M.Modal.init(elems);
});

// This will initialize necessary variables and manipulate the DOM
init();