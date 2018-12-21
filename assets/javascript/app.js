

// GAME OBJECT
//========================================

var Game = {

    // VARIABLES
    //============================================
    time: 30,
    score: 100,
    questionCount: 10,
    correctCount: 0,
    wrongCount: 0,
    questionNum: 0,
    category: "",
    questions: [],
    question: "",
    answers: [],
    correct: "",
    catNum: 9,
    intervalId: 0,
    timerRunning: false,

    // METHODS
    //============================================
    
    // reset will display the start modal and re-render categories
    reset: function () {
        // resetting
        Game.time= 30;
        Game.correctCount= 0;
        Game.wrongCount= 0;
        Game.questionNum= 0;
        Game.questions= [];
        Game.answers= [];
        $("#questionCurrent").text(Game.questionNum +1);
        $("#categories").empty();
        $("#msg").text("Get Ready!");
        $("#endMenu").modal('hide');
        // show start menu
        $("#startMenu").modal('show');
        // display categories
        this.renderCategories();
    },
    
    // renderCategories will take 6 random categories and display them for the user
    renderCategories: function(){
        var categories = [];
        var queryURL = "https://opentdb.com/api_category.php";
        $.ajax({
            url: queryURL,
            method: "GET"
            }).then(function(response) {
                // Get list of available categories from API
                categories = response.trivia_categories;
                // Shuffle the list of categories so it's random each time
                categories = shuffle(categories);
                // Reduce to only 6 categories
                categories = categories.slice(0,6);
                console.log(categories);
                categories.forEach(category => {
                    $("<button>", {
                        "class": "categoryBtn btn btn-primary col-12",
                        "id": parseInt(category.id),
                        "text": category.name
                    }).appendTo("#categories");
                });
            });
    },

    // Start will take the category number and initialize the game with that category
    start: function(catNum){
        // API category number from category
        console.log("catnum",catNum);
        // Make the query
        // Query specifies that we always want:
            // 10 questions
            // Hard difficulty
            // Multiple choice
            // Base 64 encoding
        var queryURL = "https://opentdb.com/api.php?amount="+this.questionCount+"&category="+catNum+"&difficulty=hard&type=multiple&encode=base64";
        // AJAX call
        $.ajax({
            url: queryURL,
            method: "GET"
            }).then(function(response) {
                // Thanks to Andrew for the below:
                if(response && response.results && response.results.length > 0)
                // Game will begin once results have been stored
                setTimeout(Game.hideStartMenu,200);
                Game.initializeTrivia(response);
                Game.displayCategory(response.results[0].category);
        })
        // Thanks again
        .catch((e) => {
            console.log('No hard questions',e);
            // If there are no hard questions, it normally would error out and return nothing
            // If there are no hard questions, we will get rid of the difficulty query
            queryURL = "https://opentdb.com/api.php?amount="+this.questionCount+"&category="+catNum+"&type=multiple&encode=base64";
            $.ajax({
                url: queryURL,
                method: "GET"
                }).then(function(response) {
                    // Thanks to Andrew for the below:
                    if(response && response.results && response.results.length > 0)
                    // Game will begin once results have been stored
                    setTimeout(Game.hideStartMenu,200);
                    Game.initializeTrivia(response);
                    Game.displayCategory(response.results[0].category);
            })
        })
    },

    // hides the start menu
    hideStartMenu: function () {
        // on start of the game, will close the modal
        //change start menu to display none
        $("#startMenu").modal("hide");
    },

    // starts trivia with the selected category's API output
    initializeTrivia: function(response){
        // store questions
        this.getQuestionArray(response);
        // display category
        Game.displayCategory(response.results[0].category);
        // run trivia
        this.runTrivia(Game.questions[0]);
        // iterate through questions Array, ONLY FOR DEBUGGING PURPOSES
        // Game.questions.forEach(question => {
        //     this.getQuestion(question);
        //     this.renderQuestion();
        // });
    },

    // run trivia will take a question and run the trivia game on it
    runTrivia: function(){
        this.getQuestion(Game.questions[Game.questionNum]);
        this.renderQuestion();
        this.resetTimer();
        this.startTimer();
    },

    // displayCategory will take a string and display it to the top left box
    displayCategory: function(str){
        $("#category").text(atob(str));
    },

    // getQuestionArray will take response and store array of question objects
    getQuestionArray: function(response){
        Game.questions = response.results;
    },

    // getQuestion will take the question array and take one question
    getQuestion: function(obj){
        // set question
        this.question = atob(obj.question);
        console.log(this.question);
        // create an array of answers from wrong answers
        this.answers = (obj.incorrect_answers);
        // set the correct answer
        this.correct = (obj.correct_answer);
        // add the correct answer to answer array
        this.answers.push(this.correct);
        // shuffling array of answers
        this.answers = shuffle(this.answers);
        // decoding answers
        for (i=0;i<this.answers.length;i++){
            this.answers[i] = atob(this.answers[i]);
        }
        console.log(this.answers);
    },
    
    // renderQuestion will take the question and put it on the page
    renderQuestion: function(){
        $("#question").empty();
        $("#question").append("<h3>"+Game.question+"</h3>")
        for (var i=0;i<Game.answers.length;i++){
            var currentAnswer = Game.answers[i];
            console.log("current answer",currentAnswer);
            $("#answer"+i).empty();
            $("<button>",{
                "class":"answerButton btn btn-danger",
                "id":"ans"+i,
                "text":currentAnswer
            }).appendTo("#answer"+i);
        }
    },

    // checkAnswer will check if their answer is correct and update score
    checkAnswer: function(str){
        if(str==atob(Game.correct)){
            Game.correctCount++;
            swapClass("#messageBox","btn-*","btn-success");
            Game.timerStop();
            $("#msg").text("YOU GOT LUCKY");

            var correctSelector = "button:contains("+atob(Game.correct)+")";
            swapClass(correctSelector,"btn-danger","btn-success");

            setTimeout(function(){
                swapClass("#messageBox","btn-success","btn-dark");
                Game.nextQuestion();
            },1000);
            console.log("correct");
        } else{
            Game.wrongCount++;
            swapClass("#messageBox","btn-*","btn-danger");
            Game.timerStop();
            var wrongMsgs = ["WOW YOU'RE TERRIBLE AT THIS","STAY IN SCHOOL KID","DON'T QUIT YOUR DAY JOB","PLEASE JUST STOP","YOU'RE NOT GOING TO GET IT","THIS IS JUST SAD","THE CORRECT ANSWER IS A","YOUR TEACHERS HAVE FAILED YOU","DID YOU PAY MONEY FOR YOUR EDUCATION?"];
            var index = (Math.floor(Math.random()*wrongMsgs.length));
            $("#msg").text(wrongMsgs[index]);

            var correctSelector = "button:contains("+atob(Game.correct)+")";
            swapClass(correctSelector,"btn-danger","btn-success");

            setTimeout(function(){
                swapClass("#messageBox","btn-danger","btn-dark");
                Game.nextQuestion();
            },1000);
            console.log("wrong");
        }
    },

    // nextQuestion will increment the number of question that you're on, reset the timer, and show the next question
    nextQuestion: function(){
        if (Game.questionNum>8){
            console.log("over");
            this.endGame();
        } else{
            console.log("next question!",Game.questionNum);
            Game.questionNum++;
            clearInterval(Game.intervalId);
            this.resetTimer();
            swapClass("#messageBox","btn-danger","btn-dark");
            $("#msg").text("Get Ready!");
            $("#questionCurrent").text(Game.questionNum +1);
            this.getQuestion(Game.questions[Game.questionNum]);
            this.renderQuestion();
            this.startTimer();    
        }
    },

    endGame: function(){
        $("#endMenu").modal('show');
        $("#correct").text(Game.correctCount);
        $("#wrong").text(Game.wrongCount);
        var score = (Game.correctCount/Game.questionCount)*100;
        $("#score").text(score);
    },

    startTimer: function(){
        if(!Game.timerRunning){
            Game.intervalId = setInterval(this.timerCount, 1000);
            Game.timerRunning = true;
        }
    },

    timerCount: function(){
        Game.time--;
        // console.log(Game.time);
        $("#time").text(Game.time);
        if(Game.time<1){
            Game.wrongCount++;
            Game.nextQuestion();
        } else if (Game.time <2){
            swapClass("#messageBox","btn-warning","btn-danger");
            $("#msg").text("YOU FAILED");
        } else if (Game.time < 6){
            swapClass("#messageBox","btn-primary","btn-warning");
            $("#msg").text("5 SECONDS REMAINING");
        } else if (Game.time < 11){
            swapClass("#messageBox","btn-success","btn-primary");
            $("#msg").text("10 SECONDS REMAINING");        
        } else{
            swapClass("#messageBox","btn-dark","btn-success");
            $("#msg").text("<30 SECONDS REMAINING");
        }
    },

    timerStop: function(){
        clearInterval(Game.intervalId);
        Game.timerRunning=false;
    },

    resetTimer: function(){
        Game.time = 30;
        $("#time").text(Game.time);
        Game.timerRunning = false;
    }
}


// RUNTIME
//=================================
Game.reset();

// LISTENERS
//=============================
// $("#startButton").on("click",function(){
// });

$(document).on("click",".categoryBtn", function () {
    console.log(this);
    Game.category = this.text;
    Game.catNum = parseInt(this.id);
    Game.questions = Game.start(Game.catNum);
});

$(document).on("click",".answerButton",function(){
    var ans = $(this).text();
    console.log(atob(Game.correct));
    console.log(ans);
    Game.checkAnswer(ans);
});

$(document).on("click","#resetButton",function(){
    Game.reset();
});

// UTILITY FUNCTIONS
//======================================
// shuffle will take an array and return that array in shuffled form
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

function swapClass(selector,oldClass,newClass){
    $(selector).addClass(newClass).removeClass(oldClass);
}