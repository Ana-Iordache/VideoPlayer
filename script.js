"use strict";

/**
 * Preluare continut div aferent playlistului - WEB STORAGE API
 * (modificat anterior prin adaugare/stergere/reordonare videoclipuri)
 */
if (localStorage.playlistDivStocat) {
    document.querySelector(".playlist").innerHTML = localStorage.playlistDivStocat;
}

/**
 * Lista ce contine fiecare videoclip din playlist
 */
let playlist = document.querySelectorAll(".playlist .video video");

/**
 * Lista ce contine div-ul aferent fiecarui videoclip din playlist
 */
let playlistDiv = document.querySelectorAll(".playlist .video");

/**
 * Lista ce contine icon-urile de tip "cos de gunoi" din fiecare div aferent videclipurilor
 * (al doilea element <i> din div)
 */
let trashesIcons = document.querySelectorAll(".playlist .fa-trash-alt");

/**
 * Videoclipul curent, care este desenat pe canvas
 */
let videoCurent = document.querySelector(".continut-principal video");

/**
 * Variabila in care se retine efectul aplicat
 * (initial este none)
 */
let effect = "none";

/**
 * Div-ul ce afiseaza efectul curent aplicat
 */
const currentEffect = document.getElementById("current-effect");

/**
 * Lista de butoane/inputuri cu tipul "data-effect"
 */
const butoaneEfecte = document.querySelectorAll("[data-effect]");

// Preluare butoane din cadrul div-ului de controale
const btnPlay = document.getElementById("btnPlay");
const btnMute = document.getElementById("btnMute");
const btnNext = document.getElementById("btnNext");
const btnPrev = document.getElementById("btnPrev");

const momentCurent = document.getElementById("momentCurent"); // span-ul ce contine momentul curent al video-ului
const durata = document.getElementById("durata"); // span-ul ce contine durata totala a video-ului
const progressBar = document.getElementById("progressBar"); // inputul de tip range aferent progress barului

const btnSubtitles = document.getElementById("btnSubtitles"); // butonul pentru activare/dezactivare subtitrari

const volum = document.getElementById("volum"); // inputul de tip range aferent volumului
const procentVolum = document.getElementById("procent-volum"); // span-ul ce contine procentul aferent nivelului volumului

/**
 * Videoclip curent, in curs de redare (desenat pe canvas)
 */
const video = document.getElementById("video-principal");

/**
 * Preluare volum setat anterior - WEB STORAGE API
 * (background-ul slider-ului aferent volumului)
 */
if (localStorage.volumStocat) {
    volum.style.backgroundSize = Number(localStorage.volumStocat) * 100 + "% 100%";
}

/**
 * Apel functii ce vor rula la incarcarea paginii HTML
 */
document.addEventListener("load", playVideo(), deleteVideo(), addStartDragEventListener());

// Efect de luminozitatea
let luminozitate = document.getElementById("luminozitate");
let valoareLuminozitateSpan = document.getElementById("valoareLuminozitateSpan");
let valoareLuminozitate = 0;
["mousemove", "click"].forEach(ev => luminozitate.addEventListener(ev, function () {
    valoareLuminozitate = Number(luminozitate.value);
    valoareLuminozitateSpan.innerText = "Brightness: " + luminozitate.value;
}), false);

// Efect de contrast
let contrast = document.getElementById("contrast");
let valoareContrastSpan = document.getElementById("valoareContrastSpan");
let valoareContrast = 0;
["mousemove", "click"].forEach(ev => contrast.addEventListener(ev, function () {
    valoareContrast = Number(contrast.value);
    valoareContrastSpan.innerText = "Contrast: " + contrast.value;
}), false);

// Desenare video pe canvas
const canvas = document.getElementById("canvas");
const contextCanvas = canvas.getContext("2d");

video.addEventListener("canplay", () => {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
});

video.src = "./media/cantec-craciun.mp4";

/**
 * Functia de desenare a videoclipului pe canvas
 */
function draw() {
    contextCanvas.drawImage(video, 0, 0, canvas.width, canvas.height);
    let imageData = contextCanvas.getImageData(0, 0, canvas.width, canvas.height);
    let data = imageData.data;

    // aplicare efect selectat
    switch (effect) {
        case "none":
            currentEffect.innerText = "Applied: none";
            unsetContrastBrightness();
            break;
        case "luminozitate":
            currentEffect.innerText = "Applied: brightness changed";
            changeLuminozitate(imageData, data);
            break;
        case "contrast":
            currentEffect.innerText = "Applied: contrast changed";
            changeContrast(imageData, data);
            break;
        case "mirror":
            currentEffect.innerText = "Applied: mirror";
            mirrorEffect();
            break;
        case "upside-down":
            currentEffect.innerText = "Applied: upside-down";
            upsideDownEffect();
            break;
        case "two-channels":
            currentEffect.innerText = "Applied: two channels";
            twoChannelsEffect(imageData, data);
            break;
        case "yellow":
            currentEffect.innerText = "Applied: yellow";
            yellowEffect(imageData, data);
            break;
        case "magenta":
            currentEffect.innerText = "Applied: magenta";
            magentaEffect(imageData, data);
            break;
        case "cyan":
            currentEffect.innerText = "Applied: cyan";
            cyanEffect(imageData, data);
            break;

    }

    // Afisare subtitrari
    let textWidth; // latimea textului scris pe canvas
    // verific daca au fost preluate subtitrarile din fisier si daca nu sunt "enabled"
    if (subtitles != "" && btnSubtitles.children[0].classList.contains("fas")) {
        contextCanvas.font = 'bold 13px sans-serif';
        contextCanvas.fillStyle = "rgba(0,0,0,0.6)";

        for (let j = 0; j < subtitles.length; j++) { // parcurg toate subtitrarule din fisierul json
            if (video.src.includes(subtitles[j].videoTitle)) { // verific care titlu din fisier corespunde cu video-ul curent
                for (let i = 0; i < subtitles[j].start.length; i++) {
                    // parcurg cele 3 obiecte ce contin timpul de start, de sfarsit si continutul aferent care sa fie afisat
                    if (video.currentTime >= subtitles[j].start[i] && video.currentTime <= subtitles[j].end[i]) {
                        // cand video-ul ajunge la un anumit moment care corespunde cu start si end din fisierul json

                        if (canvas.width > 640) { // daca dimensiunile canvasului sunt mai mari, pun un font mai mare
                            contextCanvas.font = 'bold 20px sans-serif';
                        }

                        // desenez background-ul pe care voi pune continutul
                        textWidth = contextCanvas.measureText(subtitles[j].content[i]).width;
                        contextCanvas.fillRect((canvas.width / 2 - textWidth / 2) - 5, canvas.height - 30, textWidth + 10, 22);

                        // scriu pe canvas continutul corespunzator
                        contextCanvas.fillStyle = "white";
                        contextCanvas.fillText(subtitles[j].content[i], canvas.width / 2, canvas.height - 15);
                        contextCanvas.textAlign = "center";
                    }
                }
                break;
            }
        }
    }

    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);


/**
 * Preluare subtitrari din fisier json
 */
let subtitles = "";
btnSubtitles.addEventListener("click", function () {
    if (btnSubtitles.children[0].classList.contains("far")) {
        btnSubtitles.children[0].classList.remove("far");
        btnSubtitles.children[0].classList.add("fas");
        btnSubtitles.title = "Disable subtitles";

        let xmlHttpRequest = new XMLHttpRequest();
        xmlHttpRequest.open("GET", "./media/subtitles.json", false);
        xmlHttpRequest.send(null);
        subtitles = JSON.parse(xmlHttpRequest.responseText);
    } else {
        btnSubtitles.children[0].classList.remove("fas");
        btnSubtitles.children[0].classList.add("far");
        btnSubtitles.title = "Enable subtitles";
    }
});

/**
 * Aplicare efecte
 */
for (let i = 0; i < butoaneEfecte.length; i++) {
    butoaneEfecte[i].addEventListener("mousedown", function () {
        contextCanvas.restore();
        contextCanvas.save();
        effect = this.dataset.effect;
    });
}

/**
 * Functie pentru resetarea range-urilor aferente luminozitatii si contrastului
 */
function unsetContrastBrightness() {
    luminozitate.value = 0;
    valoareLuminozitateSpan.innerText = "Brightness: 0";

    contrast.value = 0;
    valoareContrastSpan.innerText = "Contrast: 0";
}
/**
 * Functie pentru modificarea luminozitatii
 */
function changeLuminozitate(imageData, data) {
    contrast.value = 0;
    valoareContrastSpan.innerText = "Contrast: 0";

    for (let i = 0; i < data.length; i += 4) {
        data[i] += valoareLuminozitate;
        data[i + 1] += valoareLuminozitate;
        data[i + 2] += valoareLuminozitate;
    }
    contextCanvas.putImageData(imageData, 0, 0);
}
/**
 * Functie pentru modificarea contrastului
 */
function changeContrast(imageData, data) {
    luminozitate.value = 0;
    valoareLuminozitateSpan.innerText = "Brightness: 0";

    let fact = (255.0 + valoareContrast) / (255.01 - valoareContrast);
    for (let i = 0; i < data.length; i += 4) {
        data[i] = 128.0 + fact * (data[i] - 128.0);
        data[i + 1] = 128.0 + fact * (data[i + 1] - 128.0);
        data[i + 2] = 128.0 + fact * (data[i + 2] - 128.0);
    }
    contextCanvas.putImageData(imageData, 0, 0);
}
/**
 * Functie pentru afisareea videoclipului in oglinda
 */
function mirrorEffect() {
    unsetContrastBrightness();

    contextCanvas.save();

    contextCanvas.translate(canvas.width, 0);
    contextCanvas.scale(-1, 1);
    contextCanvas.drawImage(video, 0, 0, canvas.width, canvas.height);

    contextCanvas.restore();
}
/**
 * Functie pentru afisarea videoclipului "cu susul in jos"
 * (rotire la 180 garde)
 */
function upsideDownEffect() {
    unsetContrastBrightness();

    contextCanvas.save();

    contextCanvas.translate(canvas.width / 2, canvas.height / 2);
    contextCanvas.rotate(180 * Math.PI / 180);
    contextCanvas.translate(-canvas.width / 2, -canvas.height / 2);
    contextCanvas.drawImage(video, 0, 0, canvas.width, canvas.height);

    contextCanvas.restore();
}
/**
 * Functie pentru setarea culorii galben asupra videoclipului
 */
function yellowEffect(imageData, data) {
    unsetContrastBrightness();

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = 0;
    }
    contextCanvas.putImageData(imageData, 0, 0);
}
/**
 * Functie pentru setarea culorii magenta asupra videoclipului
 */
function magentaEffect(imageData, data) {
    unsetContrastBrightness();

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const b = data[i + 2];
        data[i] = r;
        data[i + 1] = 0;
        data[i + 2] = b;
    }
    contextCanvas.putImageData(imageData, 0, 0);
}
/**
 * Functie pentru setarea culorii cyan asupra videoclipului
 */
function cyanEffect(imageData, data) {
    unsetContrastBrightness();

    for (let i = 0; i < data.length; i += 4) {
        const g = data[i + 1];
        const b = data[i + 2];
        data[i] = 0;
        data[i + 1] = g;
        data[i + 2] = b;
    }
    contextCanvas.putImageData(imageData, 0, 0);
}
/**
 * Functie pentru setarea a doua canale de culoare asupra video-ului
 * (rosu si gablen)
 */
function twoChannelsEffect(imageData, data) {
    unsetContrastBrightness();
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = g;
    }
    contextCanvas.putImageData(imageData, 0, 0);
}

/**
 * Setare eveniment de click pentru canvas si butonul de pe acesta 
 * cu functionalitatea de play/pause a video-ului
 */
// preluare icon de play/pause de pe canvas
const playPauseIcon = document.getElementById("playVideo");
const iElemPlayPause = document.querySelector(".fa-play-circle");

[canvas, playPauseIcon].forEach(item => item.addEventListener("click", () => {
    if (video.paused) {
        video.play();
    }
    else {
        video.pause();
    }
}));

/**
 * Adaugare video nou in cadrul playlist-ului prin intermediul unui control de tip input
 */
const adaugaVideo = document.getElementById("adaugaVideo");
adaugaVideo.addEventListener("change", (ev) => {
    const fileReader = new FileReader();

    fileReader.addEventListener("load", (ev) => {
        // preluare url aferent videoclipului ales
        const dataUrl = ev.target.result;

        // creare element <video>
        let videoNou = document.createElement("video");
        videoNou.src = dataUrl;
        videoNou.title = "Double click to play";

        // creare element <div> in care va fi pus elementul video creat anterior
        let div = document.createElement("div");
        div.classList.add("video");
        div.draggable = true;
        div.appendChild(videoNou);
        // adaugarea icon-urilor pentru stergere si drag&drop
        div.innerHTML = div.innerHTML +
            '<i id="reorder" class="fas fa-grip-lines" title="Drag to move"></i>' +
            '<i id="trash" class="fas fa-trash-alt" title="Click to remove from playlist"></i>';

        // atasarea div-ului creat la playlist-ul curent
        document.getElementById("playlist").appendChild(div);

        updateLists();

        // Apel functii pt a se executa cu noile contunuturi ale listelor actualizate
        // pentru a se aplica toate functionalitatile si pe videoclipul nou adaugat
        playVideo();
        deleteVideo();
        addStartDragEventListener();

        // Cand adaug un nou buton, se adauga la final, deci btnNext trb sa fie disabled
        btnNext.disabled = false;

        // Stocare video noi adaugate - WEB STORAGE API
        localStorage.playlistDivStocat = document.querySelector(".playlist").innerHTML;
    });

    fileReader.readAsDataURL(ev.target.files[0]);

});

/**
 * Functie de actualizare a listelor de videoclipuri, div-urile acestora si icon-urile de trash
 */
function updateLists() {
    playlist = document.querySelectorAll(".playlist .video video");
    playlistDiv = document.querySelectorAll(".playlist .video");
    trashesIcons = document.querySelectorAll(".playlist .fa-trash-alt");
}

/**
 * Marcarea videclipului curent ales spre redare (prin setarea culorii background-ului div-ului aferent)
 * si punerea pe canvas a acestuia (abonare la eveniment de dublu click pe un video din playlist)
 */
function playVideo() {
    playlistDiv.forEach(divVideo => {
        divVideo.addEventListener("dblclick", () => {

            // elimin clasa "curent" de la toate div-urile
            playlistDiv.forEach(div => div.classList.remove("curent"));
            // si o adaug la cel pe care s-a facut dublu click
            divVideo.classList.add("curent");

            if (divVideo.classList.contains("curent")) {
                // preiau sursa videoclipului din cadrul div-ului pe care s-a facut dublu click
                let src = divVideo.children[0].getAttribute("src");
                // si o pun la videoclipul curent
                videoCurent.src = src;

                checkNextPrevBtns();
            }

            // pentru a porni videoclipul selectat spre redare automat
            videoCurent.autoplay = true;

            storeCurrentVideo();
        });
    });
}

/**
 * Stocare pozitie curenta in playlist (ultimul video redat) - WEB STORAGE API
 */
if (localStorage.videoStocat) { // daca a fost stocat vreun video
    // Elimin clasa "curent" de la orice alt video care avea inainte
    playlistDiv.forEach(div => div.classList.remove("curent"));

    // Parcurg toate video-urile din playlist pana ajung la cel stocat
    for (let i = 0; i < playlist.length; i++) {
        if (localStorage.videoStocat === playlist[i].src) {
            // Il marchez ca fiind video curent
            playlistDiv[i].classList.add("curent");
            // si setez sursa video-ului curent pe cea stocata
            videoCurent.src = localStorage.videoStocat;

            checkNextPrevBtns();

            break;
        }
    }
}

/**
 * Functie de stocare a videoclipului curent - WEB STORAGE API
 */
function storeCurrentVideo() {
    for (let i = 0; i < playlistDiv.length; i++) {
        if (playlistDiv[i].classList.contains("curent")) {
            localStorage.videoStocat = playlist[i].src;
            break;
        }
    }
}

/**
 * Functie ce face enable/disable la butoanele de play si pause in functie de situatie
 */
function checkNextPrevBtns() {
    // Verific daca videoclipul curent este primul video din playlist => sa nu am btnPrev activ
    if (videoCurent.src == playlist[0].src) {
        btnPrev.disabled = true;
    } else btnPrev.disabled = false;

    // Verific daca videoclipul curent e ultimul video din playlist => sa nu am btnNext activ
    if (videoCurent.src == playlist[playlist.length - 1].src) {
        btnNext.disabled = true;
    } else btnNext.disabled = false;
}

/**
 * Afisare controale previous, play/pause, next, progress bar si volum
 * si abonarea la evenimentele corespunzatoare
 */
// PLAY/PAUSE
btnPlay.addEventListener("click", function () {
    if (video.paused) {
        video.play();
    }
    else {
        video.pause();
    }

});

video.addEventListener("play", () => {
    const i = btnPlay.children[0]; // iconul din cadrul butonului (elementul de tip <i>)
    i.classList.remove("fa-play");
    i.classList.add("fa-pause");

    iElemPlayPause.classList.remove("fa-play-circle");
    iElemPlayPause.classList.add("fa-pause-circle");

    btnPlay.title = "Pause";
    canvas.title = "Click to pause";
    playPauseIcon.title = "Click to pause";
});

video.addEventListener("pause", () => {
    const i = btnPlay.children[0]; // iconul din cadrul butonului (elementul de tip <i>)
    i.classList.remove("fa-pause");
    i.classList.add("fa-play");

    iElemPlayPause.classList.remove("fa-pause-circle");
    iElemPlayPause.classList.add("fa-play-circle");

    btnPlay.title = "Play";
    canvas.title = "Click to play";
    playPauseIcon.title = "Click to play";
});

// MUTE/UNMUTE
btnMute.addEventListener("click", () => {
    const i = btnMute.children[0]; // iconul din cadrul butonului (elementul de tip <i>)
    if (video.muted) {
        video.muted = false;
        i.classList.remove("fa-volume-mute");
        i.classList.add("fa-volume-up");

        // Cand se da unmute, revin la volumul setat initial
        volum.value = volumCurent;
        procentVolum.innerText = Math.floor(volum.value * 100) + "%";

        volum.disabled = false;

        btnMute.title = "Mute";
    } else {
        video.muted = true;
        i.classList.remove("fa-volume-up");
        i.classList.add("fa-volume-mute");

        // Cand dau mute slider-ul va avea value=0
        volum.value = 0;
        procentVolum.innerText = Math.floor(volum.value * 100) + "%";

        // Cand apas pe mute sa nu mai pot modifica volumul
        volum.disabled = true;

        btnMute.title = "Unmute";
    }
    // Stochez volumul pe mute daca se da mute
    localStorage.volumStocat = volum.value;

    valoareVolum();
});


// NEXT/PREV
btnNext.addEventListener("click", () => {

    // parcurg videoclipurile pana ajung la cel curent si ii elimin clasa "curent"
    for (var i = 0; i < playlist.length; i++) {
        if (playlistDiv[i].classList.contains("curent")) {
            playlistDiv[i].classList.remove("curent");
            break;
        }
    }

    // daca acesta nu era ultimul video din playlist, 
    // il marchez pe urmatorul ca fiind curent
    // si il redau
    if (i != playlist.length - 1) {
        video.src = playlist[++i].src;
        video.autoplay = true;
        playlistDiv[i].classList.add("curent");

        storeCurrentVideo();
    }

    enableDisableNextPrevBtns();
});

btnPrev.addEventListener("click", () => {

    // parcurg videoclipurile pana ajung la cel curent si ii elimin clasa "curent"
    for (var i = 0; i < playlist.length; i++) {
        if (playlistDiv[i].classList.contains("curent")) {
            playlistDiv[i].classList.remove("curent");
            break;
        }
    }

    // daca acesta nu era primul video din playlist, 
    // il marchez pe cel anterior ca fiind curent
    // si il redau
    if (i != 0) {
        video.src = playlist[--i].src;
        video.autoplay = true;
        playlistDiv[i].classList.add("curent");

        storeCurrentVideo();
    }

    enableDisableNextPrevBtns();

});

// PROGRESS BAR
// Derulare video din slider
progressBar.addEventListener("change", () => {
    video.currentTime = progressBar.value;

    valoareProgres();

});
// Sa pot derula video-ul fara sa mai sara de unde il pun prima data
progressBar.addEventListener("click", (ev) => {
    video.currentTime = ev.target.value;

    valoareProgres();
});

// Setarea progresului videoclipului aferent timpului curent
progressBar.addEventListener("input", valoareProgres);
/**
 * Functie pentru determinarea pozitiei progresului videoclipului 
 * (background-ul inputului de tip range aferent progress bar-ului)
 */
function valoareProgres() {
    let minim = progressBar.min;
    let maxim = progressBar.max;
    let valoareCurenta = progressBar.value;

    progressBar.style.backgroundSize = (valoareCurenta - minim) * 100 / (maxim - minim) + "% 100%";
}

// Setarea volumului videoclipului aferent nivelului curent
volum.addEventListener("input", valoareVolum);
/**
 * Functie de determinare a nivelului volumului
 * (background-ul inputului de tip range aferent volumului)
 */
function valoareVolum() {
    let minim = volum.min;
    let maxim = volum.max;
    let valoareCurenta = volum.value;

    volum.style.backgroundSize = (valoareCurenta - minim) * 100 / (maxim - minim) + "% 100%";
}

// Preluare duratei videoclipului redat
video.addEventListener("durationchange", () => {
    durata.innerText = secondsToString(video.duration);

    progressBar.max = video.duration;
});

// Actualizare timp curent din video
video.addEventListener("timeupdate", () => {
    momentCurent.innerText = secondsToString(video.currentTime);
    progressBar.value = video.currentTime;
    valoareProgres();

    // Stocare moment curent
    localStorage.momentCurentStocat = video.currentTime;
});

/**
 * Preluare moment curent stocat - WEB STORAGE API
 */
if (localStorage.momentCurentStocat) {
    video.currentTime = Number(localStorage.momentCurentStocat);
    momentCurent.innerText = secondsToString(video.currentTime);
    progressBar.value = video.currentTime;
}

/**
 * Functie de conversie la minute a duratei
 */
function secondsToString(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);

    const secAsString = sec >= 10 ? sec : "0" + sec;

    return min + ":" + secAsString;
}

// VOLUM
/**
 * Volumul curent setat (initial e maxim)
 */
let volumCurent = 1;

const i = btnMute.children[0]; // iconul din cadrul butonului (elementul de tip <i>)
["mousemove", "click"].forEach(evtLsn => volum.addEventListener(evtLsn, (ev) => {
    video.volume = ev.target.value;
    procentVolum.innerText = Math.floor(video.volume * 100) + "%";

    volumCurent = video.volume; // Retin volumul setat ca sa il pot reseta dupa ce se da mute

    if (video.volume == 0) {
        i.classList.remove("fa-volume-up");
        i.classList.add("fa-volume-mute");
    }
    else {
        i.classList.remove("fa-volume-mute");
        i.classList.add("fa-volume-up");
    }
}));

/**
 * Stocare nivel volum setat - WEB STORAGE API
 */
volum.addEventListener("change", () => {
    localStorage.volumStocat = volum.value;
});

/**
 * Preluare nivel volum stocat - WEB STORAGE API
 */
if (localStorage.volumStocat) {
    video.volume = Number(localStorage.volumStocat);
    volum.value = video.volume;
    procentVolum.innerText = Math.floor(volum.value * 100) + "%";
}

/**
 * Trecere automata la videoclipul urmator
 */
document.querySelector(".continut-principal video").addEventListener("ended", () => {

    // parcurg videoclipurile pana ajung la cel curent si ii elimin clasa "curent"
    for (var i = 0; i < playlist.length; i++) {
        if (playlistDiv[i].classList.contains("curent")) {
            playlistDiv[i].classList.remove("curent");
            break;
        }
    }
    // Cand se ajunge la ultimul video i va fi playlist.length-1 si va iesi din for prin break
    // deci aici compar cu playlist.length-1 ca sa vad daca am ajuns la ultimul video
    // daca e ultimul, el ramane curent
    if (i != playlist.length - 1) {
        video.src = playlist[++i].src;
        video.autoplay = true;
    }

    playlistDiv[i].classList.add("curent");

    enableDisableNextPrevBtns();

    storeCurrentVideo();
});


/**
 * Functie ce face enable/disable pe butoanele de next si prev in functie de videoclipul curent
 * (daca este ultimul sau primul in playlist)
 */
function enableDisableNextPrevBtns() {
    // Daca videoclipul curent este primul, butonul de prev va fi disabled
    if (video.src == playlist[0].src) {
        btnPrev.disabled = true;
    } else btnPrev.disabled = false;

    // Daca videoclipul curent este ultimul, butonul de next va fi disabled
    if (video.src == playlist[playlist.length - 1].src) {
        btnNext.disabled = true;
    } else btnNext.disabled = false;
}


/**
 * Div-ul videoclipului pentru care se face "drag"
 */
let videoPreluat;

/**
 * Modificare ordine a videoclipurilor in playlist prin drag&drop
 */
function addStartDragEventListener() {
    playlistDiv.forEach(video => {
        video.addEventListener("dragstart", (ev) => {
            // Preiau elem pe care vreau sa-l mut
            videoPreluat = ev.target;

            // Preiau textul HTML aferent div-ului pentru care s-a declansat "dragstart"
            // si il transmit in ev de transfer si stabilesc efectul de mutare ("move")
            ev.dataTransfer.setData("text/plain", videoPreluat.innerHTML);
            ev.dataTransfer.effectAllowed = "move";
        });
    });
}

let divPlaylist = document.getElementById("playlist"); // div-ul mare (playlist)
divPlaylist.addEventListener("dragover", (ev) => {
    ev.preventDefault(); // ca sa ma poata lasa sa-i fac drop pe un alt div

    ev.dataTransfer.dropEffect = "move";
});

// Tratare eveniment de drop
divPlaylist.addEventListener("drop", (ev) => {
    ev.stopPropagation();
    ev.preventDefault();

    /**
     * Div-ul videoclipului pe care se face "drop"
     */
    let videoTinta;

    // Daca fac drop pe elementul div din care face parte video-ul
    if (ev.target.parentElement.classList[0] === "playlist") {
        videoTinta = ev.target;

    }
    // Daca fac drop pe un copil din cadrul div-ului (video sau icon)
    else {
        videoTinta = ev.target.parentElement;
    }

    // Daca fac drop pe un video marcat ca si curent (in curs de redare)
    // il pun pe canvas pe cel preluat
    if (videoTinta.classList.contains("curent")) {
        videoCurent.src = videoPreluat.children[0].src;
    }

    // Daca am preluat un video curent
    // pun pe canvas video-ul pe care fac drop
    if (videoPreluat.classList.contains("curent")) {
        videoCurent.src = videoTinta.children[0].src;
    }

    // Si ii dau si play automat
    videoCurent.autoplay = true;
    iElemPlayPause.classList.remove("fa-play-circle");
    iElemPlayPause.classList.add("fa-pause-circle");

    // interschimb continutul celor 2 div-uri
    videoPreluat.innerHTML = videoTinta.innerHTML;
    videoTinta.innerHTML = ev.dataTransfer.getData("text/plain");

    updateLists();

    deleteVideo(); // pentru a se putea sterge videoclipurile interschimbate

    checkNextPrevBtns();

    // Stocarea div-ului curent aferent playlist-ului 
    // pentru a retine ordinea actualizata a videoclipurilor
    localStorage.playlistDivStocat = document.querySelector(".playlist").innerHTML;
});

/**
 * Functie de abonare la evenimentul de click pe icon de stergere
 */
function deleteVideo() {
    trashesIcons.forEach(trash => {
        trash.addEventListener("click", deleteEvent);
    });
}

/**
 * Functie de stergere a unui video din playlist
 */
function deleteEvent() {
    if (confirm("This video will be deleted from your playlist.")) {
        // Preiau elementul de tip video din cadrul div-ului care contine <video>, <i>, <i>
        // this este cel de-al doilea elem <i>, deci
        // this.previousElementSibling -> este celalalt elem <i>
        // this.previousElementSibling.previousElementSibling -> este elem <video>
        let srcDeSters = this.previousElementSibling.previousElementSibling.src;

        // daca sterg video curent, il setez pe urmatorul ca fiind curent
        // daca il sterg ultimul video, il setez pe primul ca fiind curent
        if (videoCurent.src == srcDeSters) {
            for (let i = 0; i < playlist.length; i++) {
                if (i === playlist.length - 1) {
                    videoCurent.src = playlist[0].src;
                    playlistDiv[0].classList.add("curent");

                    enableDisableNextPrevBtns();
                }
                if (playlist[i].src === videoCurent.src) {
                    videoCurent.src = playlist[i + 1].src;
                    playlistDiv[i + 1].classList.add("curent");

                    break;
                }
            }

        }
        this.parentElement.remove(); // stergerea div-ului din playlist

        updateLists();

        enableDisableNextPrevBtns();

        // Stocarea div-ului curent aferent playlist-ului 
        // pentru a retine videoclipurile curente in playlist (cel sters sa nu mai apara)
        localStorage.playlistDivStocat = document.querySelector(".playlist").innerHTML;
    }
}