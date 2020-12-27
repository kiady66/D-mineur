//Classe pour les tuiles dans le jeu
function tuile(i, j) {
    this.i = i; // ligne dans la grille
    this.j = j; //colonne
    this.y = i * T; // position en Pixel ( T est la hauteur et la largeur dela tuile )
    this.x = j * T; // idem
    this.val = 0; // nombre de bombes ajacentes
    this.marque = false; // marquer d'un drapeux ?
    this.decouvert = false; // déja découverte ?
    this.im = null; // l'image à afficcher dans le canvas
    this.isBombe;
}


//Variable globale
var _images = {};
var T = 32;
var tuiles = null
var tuile_par_ligne;
var canvas, ctx;
var partie_termine = false;
var start;
var msec;
var win;
var sec;
var min;
var hr;
var nbBombe = 0;
var nbCaseDecouvert = 0;
var bestHr;
var bestMin;
var bestSec;
var bestMilliSec;
var scoreMess = document.createElement("div");
scoreMess.id = 'score';
var niveau;
var probaBombe;
var gameStart = false;


var sources = {
    in: "asset/tuile1.jpg",
    out: "asset/tuile2.jpg",
    dead: "asset/tuile3.jpg",
    bombe: "asset/bombe.png",
    drapeau: "asset/drapeaux.png"
};

//Prechargement des images
function ImageLoader(sources, callback) {
    var images = {};
    var loadedImages = 0;
    var numImages = 0;

    // get num of sources
    for (var src in sources) {
        numImages++;
    }

    for (var src in sources) {
        images[src] = new Image();
        images[src].onload = function () {
            if (++loadedImages >= numImages) {
                callback(images);
            }
        };
        images[src].src = sources[src];
    }
}


var init = function () {


    if (window.localStorage.getItem('level')==null){
        window.localStorage.setItem('level', 'easy');
    }

    if (window.localStorage.getItem('level')=='easy'){
        tuile_par_ligne = 5;
        probaBombe = 6;
    }

    if (window.localStorage.getItem('level')=='medium'){
        tuile_par_ligne = 10;
        probaBombe = 4;
    }
    if (window.localStorage.getItem('level')=='hard'){
        tuile_par_ligne=20;
        probaBombe = 3;
    }
    
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    size = T * tuile_par_ligne;
    canvas.width = size;
    canvas.height = size;

    posX = canvas.offsetLeft
    posY = canvas.offsetTop

    document.body.appendChild(scoreMess);

    if(window.localStorage.getItem('bestScore')!=null){
        piece = window.localStorage.getItem('bestScore').split(":")
        bestHr, bestMin, bestSec, bestMilliSec;
        bestHr = parseInt(piece[0], 10);
        bestMin = parseInt(piece[1], 10);
        bestSec = parseInt(piece[2], 10);
        bestMilliSec = parseInt(piece[3], 10);
        document.getElementById("score").innerHTML = "Meilleur Temps: " + bestHr + ":" + bestMin + ":" + bestSec + ":" + bestMilliSec;  
    }else{
        document.getElementById("score").innerHTML = "Meilleur Temps: Vous n'avez pas encore de meilleur temps";
    };

    var button_easy = document.createElement("button");
    button_easy.innerHTML = "easy";
    document.body.appendChild(button_easy);
    button_easy.addEventListener ("click", function() {
        window.localStorage.setItem('level', 'easy');
        document.location.reload(true);
      });
    var button_medium = document.createElement("button");
    button_medium.innerHTML = "medium";
    document.body.appendChild(button_medium);
    button_medium.addEventListener ("click", function() {
        window.localStorage.setItem('level', 'medium');
        document.location.reload(true);
    });
    var button_hard = document.createElement("button");
    button_hard.innerHTML = "hard";
    document.body.appendChild(button_hard);
    button_hard.addEventListener ("click", function() {
        window.localStorage.setItem('level', 'hard');
        document.location.reload(true);
    });


    tuiles = new Array(tuile_par_ligne);
    for (let ligne = 0; ligne < tuile_par_ligne; ligne++) {
        tuiles[ligne] = new Array(tuile_par_ligne);
    }

    var isReady = ImageLoader(sources, function (images) {
        _images = images;

        for (let i = 0; i < tuile_par_ligne; i++) {
            for (let j = 0; j < tuile_par_ligne; j++) {
                tuiles[i][j] = new tuile(i, j)
                tuiles[i][j].im = _images.in
                tuiles[i][j].isBombe = randomTrue(100,1);

                if (tuiles[i][j].isBombe){
                    nbBombe ++;
                } 
            }
        }
        setVal();
        render();
    });

    canvas.addEventListener("contextmenu", function (e) {
        event.preventDefault();
        if (gameStart == false){
            start = new Date();
            gameStart=true;
        }  
        var j = parseInt((e.clientX-posX)/T);
        var i = parseInt((e.clientY-posY)/T);
        console.log("i:"+i+" j:"+j);
        chrono();
        if(tuiles[i][j].decouvert==false && tuiles[i][j].marque==true && partie_termine!=true){
            tuiles[i][j].im =_images.in;
            tuiles[i][j].marque = false;
        }else if( tuiles[i][j].decouvert==false && tuiles[i][j].marque==false && partie_termine!=true){
            tuiles[i][j].im =_images.drapeau;
            tuiles[i][j].marque = true;
        }

        render();
    })


    canvas.addEventListener("click", function (e) {
        event.preventDefault();
        if (gameStart == false){
            start = new Date();
            gameStart=true;
        }  
        var j =parseInt((e.pageX-posX)/T);
        var i = parseInt((e.pageY-posY)/T);
        console.log("i:"+i+" j:"+j);
        chrono();

        if (tuiles[i][j].marque==false && !tuiles[i][j].decouvert && tuiles[i][j].isBombe==true && !partie_termine){
            showBomb();
            tuiles[i][j].im=_images.dead;
            win = false;
            partie_termine=true;
        } 
        
        if (tuiles[i][j].marque==false && tuiles[i][j].decouvert==false && tuiles[i][j].isBombe==false && !partie_termine){
            ouvrirTuiles(tuiles, i, j);
        }

        render();

        if (nbCaseDecouvert + nbBombe == tuile_par_ligne * tuile_par_ligne){
            win = true;
            var Mess = document.createElement("div");
            Mess.id = 'message';
            document.body.appendChild(Mess);

            document.getElementById("message").innerHTML = "Bravo, vous avez gagné!";
            partie_termine=true;
        } 
    })

}

var render = function () {
    for (let i = 0; i < tuiles[0].length; i++) {
        for (let j = 0; j < tuiles[0].length; j++) {

            ctx.drawImage(tuiles[i][j].im, tuiles[i][j].x, tuiles[i][j].y);
            if (tuiles[i][j].im == _images.out){
                ctx.font = '15px serif';
                ctx.fillStyle = "white";
                ctx.fillText(tuiles[i][j].val, tuiles[i][j].x+10, tuiles[i][j].y+15);
            }
        }
    }
}

//une fonction qui retourne true ou false avec une probabilité définie.
function randomTrue(max, min){
    nb_random=min + Math.floor(Math.random() * (max - min));

    if (nb_random <= max/probaBombe){
        return true;
    }
    else{
        return false;
    }
}
    
//une foncion qui montre toutes les bombes du jeu
function showBomb(){
    for (let i = 0; i < tuile_par_ligne; i++) {
        for (let j = 0; j < tuile_par_ligne; j++) {
            if (tuiles[i][j].isBombe == true) {
                tuiles[i][j].im = _images.bombe;
            }
        }
    
    }
}

//une fonction qui ouvre les tuiles
function ouvrirTuiles(tuile, i, j){

    if (i < tuile_par_ligne && i >= 0 && j < tuile_par_ligne && j >= 0){
        
        if (tuiles[i][j].decouvert==false && tuiles[i][j].isBombe==false && tuiles[i][j].val==0 && tuiles[i][j].marque==false){
            tuiles[i][j].decouvert=true;
            tuiles[i][j].im = _images.out;
            nbCaseDecouvert ++;
            setTimeout(20000);
            render();
            ouvrirTuiles(tuile, i - 1, j);
            ouvrirTuiles(tuile, i, j - 1);
            ouvrirTuiles(tuile, i, j + 1);
            ouvrirTuiles(tuile, i + 1, j);
            ouvrirTuiles(tuile, i + 1, j+1);
            ouvrirTuiles(tuile, i + 1, j-1);
            ouvrirTuiles(tuile, i - 1, j-1);
            ouvrirTuiles(tuile, i - 1, j+1);
        }

        if (tuiles[i][j].decouvert==false && tuiles[i][j].isBombe==false && tuiles[i][j].val!=0 && tuiles[i][j].marque==false){
            tuiles[i][j].decouvert=true;
            tuiles[i][j].im = _images.out;
            nbCaseDecouvert ++;
            render();
        }
    }
}

//une fonction qui incremente la valeur d'une tuile
function addVal(i, j){
    if (i < tuile_par_ligne && i >= 0 && j < tuile_par_ligne && j >= 0){
        tuiles[i][j].val++;
    }
}

//une fonction qui defini la valeur des tuiles
function setVal(){
    for (let i = 0; i < tuile_par_ligne; i++) {
        for (let j = 0; j < tuile_par_ligne; j++) {

            if (tuiles[i][j].isBombe){  
                addVal(i+1,j);
                addVal(i,j+1);
                addVal(i+1,j+1);
                addVal(i+1,j-1);
                addVal(i-1,j-1);
                addVal(i-1,j);
                addVal(i,j-1);
                addVal(i-1,j+1);
            }
        }
    }
}

function chrono() {

    if (!partie_termine) {
        end = new Date();
        diff = end - start;
        diff = new Date(diff);
        msec = diff.getMilliseconds();
        sec = diff.getSeconds();
        min = diff.getMinutes();
        hr = diff.getHours() - 1;
        if (min < 10) {
            min = "0" + min;
        }
        if (sec < 10) {
            sec = "0" + sec;
        }
        if (msec < 10) {
            msec = "00" + msec;
        } else if (msec < 100) {
            msec = "0" + msec;
        }
        document.getElementById("timer").innerHTML = hr + ":" + min + ":" + sec + ":" + msec;
        timerID = setTimeout("chrono()", 10);

    }else if (win && checkIfBestScore(hr, min, sec, msec)){
        test = true;
        document.getElementById("score").innerHTML = "Meilleur Score: " + hr + ":" + min + ":" + sec + ":" + msec;
        window.localStorage.setItem('bestScore', hr + ":" + min + ":" + sec + ":" + msec);
    }
}


function checkIfBestScore(hr, min, sec, millisec){
    var yesBestScore = false;
    if (hr < bestHr){
        return true;
    }
    if (min < bestMin && hr == bestHr){
        return true
    }
    if (sec < bestSec && min == bestMin && hr == bestHr){
        return true;
    }
    if (millisec < bestMilliSec && sec == bestSec && min == bestMin && hr == bestHr ){
        return true ;
    }
    if ( bestHr == null){
        bestHr = hr;
        bestMin = min;
        bestSec = sec;
        bestMilliSec = millisec;
        return true;
    }

    if(!yesBestScore){
        bestHr = hr;
        bestMin = min;
        bestSec = sec;
        bestMilliSec = millisec;
        return false;
    }
}






