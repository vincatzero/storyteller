const fs = require('fs');
const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');

const utilities = require('../utilities.js');

//port number to listen for http requests
const HTTP_SERVER_PORT = 53140;
//max upload size for a comment
const MAX_MEDIA_SIZE = '50mb';
/*
 * Creates an http server to accept requests from the playback page and
 * can be used with editors too.
 */
class HttpServer {
    constructor(projectManager) {
        //store a reference to the project manager
        this.projectManager = projectManager;

        //create the express server
        const app = express();

        //add middleware
        //app.use(express.static(path.join(__dirname, '..', 'public')));
        app.use(bodyParser.urlencoded({ limit: MAX_MEDIA_SIZE, extended: true }/*{ extended: false }*/));
        app.use(bodyParser.json({ limit: MAX_MEDIA_SIZE }));

        //set the routes
        this.createRoutes(app);

        //create a server listening on the storyteller port
        this.server = app.listen(HTTP_SERVER_PORT, () => console.log('The storyteller http server is up and running...'));
    }

    /*
     * Shuts down the http server.
     */
    close() {
        //close the http server
        this.server.close();
    }

    /*
     * Creates the routes that this server responds to
     */
    createRoutes(app) {
        //routes
        //request a playback page
        app.get('/playback', (req, res) => {
            this.createPlayback(req, res);
        });

        //comments
        app.post('/comment', (req, res) => {
            //add a comment
            const comment = req.body;
            this.projectManager.commentManager.addComment(comment);
            res.sendStatus(200);
        });

        app.put('/comment', (req, res) => {
            //update a comment
            const comment = req.body;
            this.projectManager.commentManager.updateComment(comment);
            res.sendStatus(200);
        });

        app.put('/commentPosition', (req, res) => {
            //update the position of a comment
            const commentPositionData = req.body;
            this.projectManager.commentManager.updateCommentPosition(commentPositionData);
            res.sendStatus(200);
        });

        app.delete('/comment', (req, res) => {
            //delete a comment
            const comment = req.body;
            this.projectManager.commentManager.deleteComment(comment);
            res.sendStatus(200);
        });

        //title and description edits
        app.put('/playbackDescription', (req, res) => {
            //set the title and description
            const playbackTitleDescription = req.body;
            this.projectManager.project.title = playbackTitleDescription.title;
            this.projectManager.project.description = playbackTitleDescription.description;
            res.sendStatus(200);
        });

        //if this server will handle http requests from editors
        if (this.projectManager.useHttpServerForEditor) {
            app.get('/close-project', (req, res) => {
                //stop storyteller
                this.projectManager.stopStoryteller();
                res.status(200).end();
            });

            app.get('/active-devs', (req, res) => {
                //get all the active devs
                res.json({ allActiveDevs: this.projectManager.developerManager.getActiveDevelopers() });
            });

            app.get('/inactive-devs', (req, res) => {
                //get all the inactive devs
                res.json({ allInactiveDevs: this.projectManager.developerManager.getInactiveDevelopers() });
            });

            //developer related 
            app.post('/update-first-developer', (req, res) => {
                const dev = req.body.devInfo;
                //replace the default dev with a new one
                this.projectManager.developerManager.replaceAnonymousDeveloperWithNewDeveloper(dev.userName, dev.email);
                res.status(200).end();
            });

            app.post('/add-new-developer', (req, res) => {
                const devInfo = req.body.devInfo;
                //create a new dev and add them to the current dev group
                this.projectManager.developerManager.createDeveloper(devInfo.userName, devInfo.email);
                this.projectManager.developerManager.addDevelopersToActiveGroupByUserName([devInfo.userName]);
                //get all the active devs
                res.json({ allActiveDevs: this.projectManager.developerManager.getActiveDevelopers() });
            });

            app.post('/add-dev-to-active-dev-group', (req, res) => {
                //add all the developers to the active dev group
                const devUserNames = req.body.devUserNames;
                this.projectManager.developerManager.addDevelopersToActiveGroupByUserName(devUserNames);
                //get all the active devs
                res.json({ allActiveDevs: this.projectManager.developerManager.getActiveDevelopers() });
            });

            app.post('/remove-dev-from-active-dev-group', (req, res) => {
                //remove all the developers to the active dev group
                const devUserNames = req.body.devUserNames;
                this.projectManager.developerManager.removeDevelopersFromActiveGroupByUserName(devUserNames);
                //get all the active devs
                res.json({ allActiveDevs: this.projectManager.developerManager.getActiveDevelopers() });
            });

            //file system /fs
            app.get('/save-all', (req, res) => {
                //save the file state
                this.projectManager.saveTextFileState();
                res.status(200).end();
            });

            app.post('/create-file', (req, res) => {
                //create a new file 
                const filePath = req.body.filePath;
                this.projectManager.createFile(filePath);
                res.status(200).end();
            });

            app.post('/delete-file', (req, res) => {
                //delete a file 
                const filePath = req.body.filePath;
                this.projectManager.deleteFile(filePath);
                res.status(200).end();
            });

            app.post('/rename-file', (req, res) => {
                //rename a file
                const oldFilePath = req.body.oldFilePath;
                const newFilePath = req.body.newFilePath;
                this.projectManager.renameFile(oldFilePath, newFilePath);
                res.status(200).end();
            });

            app.post('/move-file', (req, res) => {
                //move a file 
                const oldFilePath = req.body.oldFilePath;
                const newFilePath = req.body.newFilePath;
                this.projectManager.moveFile(oldFilePath, newFilePath);
                res.status(200).end();
            });

            app.post('/create-directory', (req, res) => {
                //create a dir
                const dirPath = req.body.dirPath;
                this.projectManager.createDirectory(dirPath);
                res.status(200).end();
            });

            app.post('/delete-directory', (req, res) => {
                //delete a directory
                const dirPath = req.body.dirPath;
                this.projectManager.deleteDirectory(dirPath);
                res.status(200).end();
            });

            app.post('/rename-directory', (req, res) => {
                //rename a directory
                const oldDirPath = req.body.oldDirPath;
                const newDirPath = req.body.newDirPath;
                this.projectManager.renameDirectory(oldDirPath, newDirPath);
                res.status(200).end();
            });

            app.post('/move-directory', (req, res) => {
                //move a directory
                const oldDirPath = req.body.oldDirPath;
                const newDirPath = req.body.newDirPath;
                this.projectManager.moveDirectory(oldDirPath, newDirPath);
                res.status(200).end();
            });

            app.post('/delete-file-or-directory', (req, res) => {
                //delete a file or directory
                const aPath = req.body.aPath;
                this.projectManager.deleteFileOrDirectory(aPath);
                res.status(200).end();
            });

            //text related /text
            app.post('/insert-text', (req, res) => {
                //insert some text
                const filePath = req.body.filePath;
                const insertedText = req.body.insertedText;
                const startRow = req.body.startRow;
                const startCol = req.body.startCol;
                const pastedInsertEventIds = req.body.pastedInsertEventIds;
                this.projectManager.handleInsertedText(filePath, insertedText, startRow, startCol, pastedInsertEventIds);
                res.status(200).end();
            });

            app.post('/delete-text', (req, res) => {
                //delete some text
                const filePath = req.body.filePath;
                const startRow = req.body.startRow;
                const startCol = req.body.startCol;
                const numElementsToDelete = req.body.numElementsToDelete;
                this.projectManager.handleDeletedText(filePath, startRow, startCol, numElementsToDelete);
                res.status(200).end();
            });
        }

        //for invalid routes
        app.use((req, res) => {
            res.status(404).send(`<h2>Uh Oh!</h2><p>Sorry ${req.url} cannot be found here</p>`);
        });
    }

    eventDecoder(codeEvents) {

        //let previousTimeStamp = codeEvents[0].timestamp;
        let currentLineNumber = codeEvents[0].lineNumber;
        let currentFileID = codeEvents[0].fileID;
        let currentEventType = codeEvents[0].type;
        let currentCreatedBy = codeEvents[0].createdByDevGroupId;

        //rebuildiing timestamps
        for (let event in codeEvents) {
            if (codeEvents[event] === codeEvents[0]) {
                continue;
            }

            // previousTimeStamp += codeEvents[event].timestamp;
            // codeEvents[event].timestamp = previousTimeStamp;

            //rebuilding line numbers
            if (!codeEvents[event].lineNumber) {
                codeEvents[event].lineNumber = currentLineNumber;
            }
            else {
                currentLineNumber = codeEvents[event].lineNumber;
            }


            //rebuilding fileIDs
            if(!codeEvents[event].fileId)
            {
                codeEvents[event].fileId = currentFileID;
            }
            else{
                currentFileID = codeEvents[event].fileId;
            }

            //rebuilding event types
            if(!codeEvents[event].type){
                codeEvents[event].type = currentEventType;
            }
            else{
                currentEventType = codeEvents[event].type;
            }

            //rebuilding createdByDevGroupId
            if (!codeEvents[event].createdByDevGroupId)
            {
                codeEvents[event].createdByDevGroupId = currentCreatedBy;
            }
            else{
                currentCreatedBy = codeEvents[event].createdByDevGroupId;
            }
        }
    }

    /*
     * Creates a page to show a playback.
     */
    createPlayback(req, res) {
        //get all of the event data 
        const codeEvents = this.projectManager.eventManager.read();

        if (codeEvents[0].minimized){
            this.eventDecoder(codeEvents);
        }

        //strip the text events from the files
        const minimizedAllFiles = {};
        for (const fileId in this.projectManager.fileSystemManager.allFiles) {
            //add everything but the textFileInsertEvents
            minimizedAllFiles[fileId] = this.projectManager.fileSystemManager.allFiles[fileId].getMinimalFileData();
        }

        //add the data members required for a playback to an object
        let playbackData = {
            codeEvents: codeEvents,
            allFiles: minimizedAllFiles,
            allDirs: this.projectManager.fileSystemManager.allDirs,
            allDevelopers: this.projectManager.developerManager.allDevelopers,
            allDeveloperGroups: this.projectManager.developerManager.allDeveloperGroups,
            currentDeveloperGroupId: this.projectManager.developerManager.currentDeveloperGroupId,
            comments: this.projectManager.commentManager.comments,
            title: this.projectManager.project.title,
            description: this.projectManager.project.description,
            branchId: this.projectManager.branchId
        };

        //TEMPORARY- using old playback page with slightly different properties
        //converts the newer format to the older one to work with the old 
        //playback.html file
        playbackData = this.convertToOldDataFormat(playbackData);

        //this will get added to the playback code and is used to detemine whether to 
        //jump to the end of the playback for adding a comment.
        let isComment = 'false';

        //if this is a playback for adding a comment 
        if (req.query.comment && req.query.comment === 'true') {

            //indicate that there should be a jump to the end of the playback to add a comment    
            isComment = 'true';
        }

        //replace parts of the template html file
        //read the playback html file that will drive the playback from the parent folder
        let playbackPage = fs.readFileSync(path.join(__dirname, 'playback.html'), 'utf8');
        playbackPage = this.replaceLoadPlaybackDataFunction(playbackPage, isComment, playbackData);
        // playbackPage = replaceCSS(playbackPage);
        // playbackPage = replaceJQuery(playbackPage);
        // playbackPage = replaceBootstrap(playbackPage);
        // playbackPage = replaceMD5(playbackPage);
        // playbackPage = replaceJSZip(playbackPage);

        res.send(playbackPage);
    }

    /*
     * Takes the latest playback data and converts it into a form that can be 
     * used with the old playback.html file. 
     * TODO get rid of this when there is a new playback.html
     */
    convertToOldDataFormat(newPlaybackData) {
        //create a new object and convert a few of the properties along the way
        const oldPlaybackData = {
            codeEvents: this.convertEvents(newPlaybackData.codeEvents),
            allFiles: this.convertFiles(newPlaybackData.allFiles), //TODO strip the text events from the files
            allDirs: this.convertDirs(newPlaybackData.allDirs),
            allDevelopers: this.convertDevelopers(newPlaybackData.allDevelopers),
            allDeveloperGroups: newPlaybackData.allDeveloperGroups,
            currentDevGroupId: newPlaybackData.currentDeveloperGroupId,
            comments: newPlaybackData.comments,
            playbackDescription: { title: newPlaybackData.title, description: newPlaybackData.description },
            branchId: newPlaybackData.branchId
        };

        return oldPlaybackData;
    }

    /*
     * Converts new events into old ones.
     * TODO get rid of this when there is a new playback.html
     */
    convertEvents(codeEvents) {
        //go through all of the new events
        return codeEvents.map(newEvent => {
            //create an old event for each new one
            const oldEvent = {
                //same: id, timestamp , createdByDevGroupId 
                id: newEvent.id,
                timestamp: newEvent.timestamp,
                createdByDevGroupId: newEvent.createdByDevGroupId,
            };

            //if the event is not relevant to playback, mark the old one as such
            if (newEvent.permanentRelevance === 'never relevant') {
                oldEvent['permanentRelevance'] = 'never relevant';
            }

            //handle event types
            if (newEvent.type === 'CREATE DIRECTORY') {
                //change the event type
                oldEvent['type'] = 'Create Directory';
                //same
                oldEvent['directoryId'] = newEvent.directoryId;
                oldEvent['parentDirectoryId'] = newEvent.parentDirectoryId;
                //map properties from new to old
                oldEvent['initialName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.directoryPath).base));
            } else if (newEvent.type === 'DELETE DIRECTORY') {
                //change the event type
                oldEvent['type'] = 'Delete Directory';
                //same
                oldEvent['directoryId'] = newEvent.directoryId;
                oldEvent['parentDirectoryId'] = newEvent.parentDirectoryId;
                //map properties from new to old
                oldEvent['directoryName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.directoryPath).base));
            } else if (newEvent.type === 'RENAME DIRECTORY') {
                //change the event type
                oldEvent['type'] = 'Rename Directory';
                //same
                oldEvent['directoryId'] = newEvent.directoryId;
                //map properties from new to old
                oldEvent['newDirectoryName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.newDirectoryPath).base));
                oldEvent['oldDirectoryName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.oldDirectoryPath).base));
            } else if (newEvent.type === 'MOVE DIRECTORY') {
                //change the event type
                oldEvent['type'] = 'Move Directory';
                //same
                oldEvent['directoryId'] = newEvent.directoryId;
                oldEvent['newParentDirectoryId'] = newEvent.newParentDirectoryId;
                oldEvent['oldParentDirectoryId'] = newEvent.oldParentDirectoryId;
                //map properties from new to old
                oldEvent['directoryName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.newDirectoryPath).base));
                oldEvent['newParentDirectoryName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.newDirectoryPath).base));
                oldEvent['oldParentDirectoryName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.oldDirectoryPath).base));
            } else if (newEvent.type === 'CREATE FILE') {
                //change the event type
                oldEvent['type'] = 'Create File';
                //same
                oldEvent['fileId'] = newEvent.fileId;
                oldEvent['parentDirectoryId'] = newEvent.parentDirectoryId;
                //map properties from new to old
                oldEvent['initialName'] = utilities.normalizeSeparators(path.parse(newEvent.filePath).base);
            } else if (newEvent.type === 'DELETE FILE') {
                //change the event type
                oldEvent['type'] = 'Delete File';
                //same
                oldEvent['fileId'] = newEvent.fileId;
                oldEvent['parentDirectoryId'] = newEvent.parentDirectoryId;
                //map properties from new to old
                oldEvent['fileName'] = utilities.normalizeSeparators(path.parse(newEvent.filePath).base);
            } else if (newEvent.type === 'RENAME FILE') {
                //change the event type
                oldEvent['type'] = 'Rename File';
                //same
                oldEvent['fileId'] = newEvent.fileId;
                //map properties from new to old
                oldEvent['newFileName'] = utilities.normalizeSeparators(path.parse(newEvent.newFilePath).base);
                oldEvent['oldFileName'] = utilities.normalizeSeparators(path.parse(newEvent.oldFilePath).base);
            } else if (newEvent.type === 'MOVE FILE') {
                //change the event type
                oldEvent['type'] = 'Move File';
                //same
                oldEvent['fileId'] = newEvent.fileId;
                oldEvent['newParentDirectoryId'] = newEvent.newParentDirectoryId;
                oldEvent['oldParentDirectoryId'] = newEvent.oldParentDirectoryId;
                //map properties from new to old
                oldEvent['fileName'] = utilities.normalizeSeparators(path.parse(newEvent.newFilePath).base);
                oldEvent['newParentDirectoryName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.newFilePath).dir));
                oldEvent['oldParentDirectoryName'] = utilities.normalizeSeparators(utilities.addEndingPathSeparator(path.parse(newEvent.oldFilePath).dir));
            } else if (newEvent.type === 'INSERT') {
                //change the event type
                oldEvent['type'] = 'Insert';
                //same
                oldEvent['character'] = utilities.unescapeSpecialCharacter(newEvent.character);
                if (newEvent.previousNeighborId) {
                    oldEvent['previousNeighborId'] = newEvent.previousNeighborId;
                } else {
                    oldEvent['previousNeighborId'] = 'none';
                }
                oldEvent['lineNumber'] = newEvent.lineNumber;
                oldEvent['column'] = newEvent.column;
                oldEvent['fileId'] = newEvent.fileId;
                oldEvent['pastedEventId'] = newEvent.pastedEventId;
            } else if (newEvent.type === 'DELETE') {
                //change the event type
                oldEvent['type'] = 'Delete';
                //same
                oldEvent['fileId'] = newEvent.fileId;
                oldEvent['character'] = utilities.unescapeSpecialCharacter(newEvent.character);
                oldEvent['previousNeighborId'] = newEvent.previousNeighborId;
                oldEvent['lineNumber'] = newEvent.lineNumber;
                oldEvent['column'] = newEvent.column;
                oldEvent['fileId'] = newEvent.fileId;
            }
            return oldEvent;
        });
    }
    /*
     * Converts new files into old ones.
     * TODO get rid of this when there is a new playback.html
     */
    convertFiles(newAllFiles) {
        const oldAllFiles = {};
        for (const fileId in newAllFiles) {
            oldAllFiles[fileId] = {
                id: newAllFiles[fileId].id,
                parentId: newAllFiles[fileId].parentDirectoryId,
                currentName: newAllFiles[fileId].currentPath,
                isDeleted: newAllFiles[fileId].isDeleted
            }
        }
        return oldAllFiles;
    }
    /*
     * Converts new dirs into old ones.
     * TODO get rid of this when there is a new playback.html
     */
    convertDirs(newAllDirs) {
        const oldAllFiles = {};
        for (const dirId in newAllDirs) {
            oldAllFiles[dirId] = {
                id: newAllDirs[dirId].id,
                parentId: newAllDirs[dirId].parentDirectoryId,
                currentName: newAllDirs[dirId].currentPath,
                isDeleted: newAllDirs[dirId].isDeleted
            }
        }
        return oldAllFiles;
    }
    /*
     * Converts new devs into old ones.
     * TODO get rid of this when there is a new playback.html
     */
    convertDevelopers(newAllDevelopers) {
        const oldAllDevelopers = {};
        for (const devId in newAllDevelopers) {
            oldAllDevelopers[devId] = {
                id: newAllDevelopers[devId].id,
                firstName: newAllDevelopers[devId].userName,
                lastName: '',
                email: newAllDevelopers[devId].email
            };
        }
        return oldAllDevelopers;
    }

    /*
     * Replaces a function in the static playback.html file with one that loads
     * the data for the playback.
     */
    replaceLoadPlaybackDataFunction(playbackPage, isComment, playbackData) {
        //function to load all of the playback data to the html file. This will be added to the html in playbackPage
        let loadPlaybackDataFunction = `function loadPlaybackData() {
                //collect the playback data from the editor- events and developer info
                playbackData.codeEvents = ${JSON.stringify(playbackData.codeEvents)};
                playbackData.allDevelopers = ${JSON.stringify(playbackData.allDevelopers)}; 
                playbackData.allDeveloperGroups = ${JSON.stringify(playbackData.allDeveloperGroups)};
                playbackData.allFiles = ${JSON.stringify(playbackData.allFiles)};
                playbackData.allDirs = ${JSON.stringify(playbackData.allDirs)};
                playbackData.currentDevGroupId = ${JSON.stringify(playbackData.currentDevGroupId)};
                playbackData.comments = ${JSON.stringify(playbackData.comments)};
                playbackData.playbackDescription = ${JSON.stringify(playbackData.playbackDescription)};
                playbackData.branchId = ${JSON.stringify(playbackData.branchId)};
                
                //setup a new playback with the current data
                getPlaybackWindowsReadyForAnimation(true);
            
                //if this is a playback for a comment
                if(${isComment}) {
                
                    //step forward as far as possible
                    step("forward", Number.MAX_SAFE_INTEGER);
                }
            }`;

        //the text in the file to replace
        const templateText = "function loadPlaybackData() {} //!!! string replacement of function here !!!";

        //replace the dummy text with the new function
        //javascript's replace() function will replace some special characters, 
        //'$&' for example, in the simplest case with some text. Since many js 
        //libraries include '$' we will use another version of replace that 
        //doesn't (see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace 
        //for more info).   
        return playbackPage.replace(templateText, function () { return loadPlaybackDataFunction; });
    }
}

module.exports = HttpServer;