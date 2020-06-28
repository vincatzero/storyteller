//this is a sample js file that can be served for playback. All js files added
//for playback should be placed in /core/public/js/ and the storyteller server
//will serve these. 

//We can use classes here instead of plain functions

async function InitializePlayback()
{
    try {
        const eventsList = await Promise.all([
            fetch('/event')
        ]);

        const results = await Promise.all([
            eventsList[0].json()
        ]);

        playbackData.events = results[0];
        playbackData.numEvents = playbackData.events.length;
        AddEventListeners();


    } catch(err) {
        console.log(`Error retrieving data`);
    }
}

function AddEventListeners()
{
    //get the controls
    const stepBackOne = document.getElementById("stepBackOne");
    const stepForwardOne = document.getElementById("stepForwardOne");
    const restartButton = document.getElementById("restartButton");
    const playbackSlider = document.getElementById("playbackSlider");
    const highlightButton = document.getElementById("highlightButton");

    //Get references to the tabs and where the tabs get their content
    const tabsList = document.getElementById("tabsList");
    const tabContent = document.getElementById("tabContent");

    playbackSlider.setAttribute("max", playbackData.numEvents);
    
    //add event handlers for clicking the buttons
    stepBackOne.addEventListener("click", event => {
        step(-1);
    });

    stepForwardOne.addEventListener("click", event => {
        step(1);
    });

    //The restart will be depreciated soon
    restartButton.addEventListener("click", event => {
        
        //reset the next event and the slider
        playbackData.nextEventPosition = 0;
        playbackSlider.value = 0;

        //for measuring which approach is faster
        //get the starting timestamp
        const t0 = performance.now();

        editor.setValue("");

        //get the ending timestamp
        const t1 = performance.now();

        //print the duration in ms
        console.log(`Reset took: ${(t1 - t0)} ms`);
    });

    //add event handler to listen for changes to the slider
    playbackSlider.addEventListener("input", event => {
        //DEBUG
        // console.log(`slide: ${playbackSlider.value}`);
        
        //take the slider value and subtract the next event's position
        step(playbackSlider.value - playbackData.nextEventPosition);
    });

    highlightButton.addEventListener("click", event =>{
        //get the selected code
        //const selection = editor.getSession().getSelection().getRange();
        const selections = editor.getSession().getSelection().getAllRanges();

        //clear any existing highlights
        clearHighlights();
        
        for (let i = 0; i < selections.length; i++){
            //add the highlight to the selected code
            addHighlight(selections[i].start.row, selections[i].start.column, selections[i].end.row, selections[i].end.column);
        }
    });

    document.querySelector("#addCommentButton").addEventListener("click", event =>{
        
        var textCommentTextArea = document.querySelector("#textCommentTextArea");

        var commentText = textCommentTextArea.value.trim();

        //get all selected ranges from Ace       
        const ranges = editor.getSession().getSelection().getAllRanges();

        let test = ranges[0].start;
        console.log(ranges);
        console.log(test);
        //get all selected text from Ace
        const selectedText = editor.getSelectedText();
        console.log(typeof(selectedText));
        


        //get all images associated with this comment

        //if there was a comment, some selected text, or at least one image
        

        //get the event to playback this comment
        var eventIndex = playbackData.nextEventPosition > 0  ? playbackData.nextEventPosition -1: 0;
        var commentEvent = playbackData.events[eventIndex];

        //create an object that has all of the comment info
        var comment = {
            commentText,
            timestamp: new Date().getTime(),
            displayCommentEvent: commentEvent,
            selectedCodeText: selectedText,
            selectedCodeBlocks: ranges,            
            imageURLs: [],
            videoURLs: [],
            audioURLs: []
        };
        

        //determine if any comments already exist for this event 
        //if so add the new comment
        //if not create a new array for the comments then add the comments
        if (!playbackData.comments[commentEvent.id]){
            playbackData.comments[commentEvent.id] = [];
        }
        playbackData.comments[commentEvent.id].push(comment);
        
        //clear out the text area
        textCommentTextArea.value = "";


        //display a newly added comment on the current event
        displayComments();

        //clear out any images uploaded for this comment


    });

    var handler = document.querySelector('.handler');
    var wrapper = handler.closest('.wrapper');
    var boxA = wrapper.querySelector('.box');
    var isHandlerDragging = false;

    document.addEventListener('mousedown', function (e) {
        // If mousedown event is fired from .handler, toggle flag to true
        if (e.target === handler) {
            isHandlerDragging = true;
            window.addEventListener('selectstart', disableSelect);
        }

    });

    document.addEventListener('mousemove', function (e) {
        // Don't do anything if dragging flag is false
        if (!isHandlerDragging) {
            return false;
        }

        // Get offset
        var containerOffsetLeft = wrapper.offsetLeft;
        
        // Get x-coordinate of pointer relative to container
        var pointerRelativeXpos = e.clientX - containerOffsetLeft;

        if (pointerRelativeXpos > screen.width * .1 && pointerRelativeXpos < screen.width * .75) {        
            boxA.style.width = e.pageX + 'px';
            boxA.style.flexGrow = 0;
            $('#codePanel').css("width", screen.width - pointerRelativeXpos);
        }
    });

    document.addEventListener('mouseup', function (e) {
        // Turn off dragging flag when user mouse is up
        isHandlerDragging = false;
        window.removeEventListener('selectstart', disableSelect);
    });
}

//disables mouse selection of text
function disableSelect(event) {
    event.preventDefault();
}
