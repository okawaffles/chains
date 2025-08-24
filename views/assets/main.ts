import pluralize from "https://cdn.jsdelivr.net/npm/pluralize/+esm";

interface Solution {
    date: string,
    words: Array<string>,
    by: string,
}

interface GameState {
    solution: Solution,
    states: Array<{solved: boolean, guesses: number}>
}

let GAME_STATE: GameState;
let SELECTED = 1;

let d = new Date();
const offset = d.getTimezoneOffset();
d = new Date(d.getTime() - (offset*60*1000));
let DATE = d.toISOString().split('T')[0];
console.log(`chains/main -- the date is ${DATE}`);
const f = new Date(DATE);
const n = new Date('2025-07-30'); // game started on july 30th 2025
const diff = f.getTime() - n.getTime();
let NUMBER = Math.floor(diff / 86400000) + 1;
const TODAY_NUMBER = NUMBER; // this will not be changed through loading previous puzzles
console.log(`chains/main -- the puzzle number is #${NUMBER}`);
let PLAYING_PREVIOUS = false;

// main game functions

function ResetGame() {
    console.log('chains/main -- resetting game...');
    // initialize game state
    $('#game').empty();
    GAME_STATE = {
        solution: {date:'',words:[],by:''},
        states: []
    };
}

async function LoadPuzzle(date: string): Promise<boolean> {
    console.log(`chains/main -- loading puzzle "${date}"`)
    const response = await fetch(`puzzle/${date}`);
    
    if (response.status == 404) {
        console.error(`chains/main -- failed to load puzzle "${date}": ${response.statusText}`);
        return false;
    }

    const data = await response.json();

    GAME_STATE.solution = {
        words: data.words,
        by: data.by,
        date
    };

    GAME_STATE.states.push({solved:true,guesses:0});
    for (let i = 1; i < data.words.length - 1; i++) {
        GAME_STATE.states.push({solved:false,guesses:0});
    }
    GAME_STATE.states.push({solved:true,guesses:0});

    $('#author').text(`Today's puzzle is by: ${data.by}`);

    console.log("chains/main -- puzzle load successful");
    return true;
}

// this function is only used to render the initial game
// other function will be used to update existing game render
async function RenderPuzzle() {
    console.log('chains/main -- render puzzle...');
    for (const word in GAME_STATE.solution.words) {
        let $word = $('<div>').addClass('word').prop('id', `word-${word}`);

        // console.log(word);

        if (parseInt(word) != 0 && parseInt(word) != GAME_STATE.solution.words.length - 1) {
            for (let i = 0; i < 10; i++) {
                let $letter = $('<div>').addClass('letter').prop('id', `word-${word}-letter-${i}`);
                if (parseInt(word) == 1 && i == 0) $letter.append(`<p>${GAME_STATE.solution.words[1][0]}</p>`);
                $word.append($letter);
            }
            $('#game').append($word);
            continue;
        }

        let i = 0;
        for (const letter of GAME_STATE.solution.words[word]) {
            // console.log(letter);
            let $letter = $('<div>').addClass('letter').prop('id', `word-${word}-letter-${i}`).append(`<p>${letter}</p>`);
            $word.append($letter);
            i++;
        }
        while (i != 10) {
            i++;
            let $letter = $('<div>').addClass('letter').prop('id', `word-${word}-letter-${i}`);
            $word.append($letter);
        }

        $('#game').append($word);
    }
    console.log('chains/main -- rendering done');
}

function ChangeSelectedWord(word: number) {
    $(`#word-${SELECTED}`).removeClass('active');
    SELECTED = word;
    if (word == GAME_STATE.solution.words.length - 1) return FinishGame();
    $(`#word-${SELECTED}`).addClass('active');
}

async function FinishGame() {
    can_interact = false;
    // await new Promise((resolve) => setTimeout(resolve, 3000));
    // alert('congrats i havent made win screen yet so heres a trophy 🏆 also moving onto next date if possible');
    $('#controls').css('display', 'none');
    $('#share').css('display', 'flex');
    $('#final-text').css('display', 'inline-block').text('perfect! well done!');
    const shared = GenerateShare();
    if (shared.includes('❌')) $('#final-text').text('no failures, good job!');
    if (shared.includes('🚫')) $('#final-text').text('aww, maybe next time...');
    // d.setDate(d.getDate() + 1);
    // DATE = d.toISOString().split('T')[0];
    // ResetGame();
    // await LoadPuzzle(DATE);
    // RenderPuzzle();
    // ChangeSelectedWord(1);
    // can_interact = true;
}

function LoadLocalStorageData() {
    console.log('chains/main -- reloading from localstorage...');
    const states: Array<{solved:boolean,guesses:number}> = JSON.parse(localStorage.getItem('chains_states') || '[]');
    const current_word: number = parseInt(localStorage.getItem('chains_current') || '1');
    if (states.length == 0) return;
    GAME_STATE.states = states;
    ChangeSelectedWord(current_word);
    // load previously cleared words
    for (let s = 1; s < states.length - 1; s++) {
        if (s == current_word) break;
        const solution_word = GAME_STATE.solution.words[s];
        for (let l = 0; l < solution_word.length; l++) {
            if (states[s].solved) {
                $(`#word-${s}-letter-${l}`).html(`<p>${solution_word[l]}</p>`);
                for (let e = 0; e < 10; e++) {
                    $(`#word-${s}-letter-${e}`).addClass('solved');
                }
            } else {
                $(`#word-${s}`).addClass('failed');
                $(`#word-${s}-letter-${l}`).html(`<p>${solution_word[l]}</p>`);
            }
        }
    }
    // load current word data
    for (let l = 0; l < states[current_word].guesses + 1; l++) {
        $(`#word-${current_word}-letter-${l}`).html(`<p>${GAME_STATE.solution.words[current_word][l]}</p>`);
    }
    console.log('chains/main -- reload from localstorage finished');
}

function GenerateShare() {
    let shared = navigator.language.toLowerCase().startsWith('zh-')?`millie.zone Chains谜题${NUMBER}\n➡️\n`:`millie.zone Chains #${NUMBER}\n➡️\n`;
    for (let i = 1; i < GAME_STATE.states.length - 1; i++) {
        if (GAME_STATE.states[i].solved) {
            for (let e = 0; e < GAME_STATE.states[i].guesses; e++) {
                shared += '❌';
            }
            shared += '✅\n';
        } else {
            // for (let e = 0; e < GAME_STATE.states[i].guesses; e++) {
            //     shared += '❌';
            // }
            shared += '🚫\n';
        }
    }
    shared += '➡️\nhttps://millie.zone/chains';
    return shared;
}

let can_interact = false;
function AttemptEntry() {
    if (!can_interact) return;
    can_interact = false;
    const solution_word = GAME_STATE.solution.words[SELECTED];
    if (($('#entry').val() as string).trim() == solution_word || pluralize.singular(($('#entry').val() as string).trim()) == solution_word) { 
        // yes
        for (let i = 0; i < solution_word.length; i++) {
            $(`#word-${SELECTED}-letter-${i}`).css('animation', '.75s guess-correct ease-in-out');
            setTimeout(() => {
                $(`#word-${SELECTED}-letter-${i}`).html(`<p>${solution_word[i]}</p>`);
                for (let e = 0; e < 10; e++) {
                    $(`#word-${SELECTED}-letter-${e}`).addClass('solved');
                }
            }, 750/2);
            setTimeout(() => {
                $(`#word-${SELECTED}-letter-${i}`).css('animation', 'none');
            }, 700);
        }
        setTimeout(() => {
            GAME_STATE.states[SELECTED].solved = true;
            ChangeSelectedWord(SELECTED + 1);
            if (!GAME_STATE.solution.words[SELECTED]) return;
            $(`#word-${SELECTED}-letter-0`).html(`<p>${GAME_STATE.solution.words[SELECTED][0]}</p>`);
            can_interact = true;
        }, 750);
    } else {
        // nopers
        // wrong animation
        for (let i = 0; i < 10; i++) {
            $(`#word-${SELECTED}-letter-${i}`).css('animation', '.75s guess-wrong ease-in-out');
            setTimeout(() => {
                $(`#word-${SELECTED}-letter-${i}`).css('animation', 'none');
            }, 750);
        }

        setTimeout(() => {
            GAME_STATE.states[SELECTED].guesses++;
            // did we fail the word?
            if (GAME_STATE.states[SELECTED].guesses == GAME_STATE.solution.words[SELECTED].length - 1) {
                // we failed
                $(`#word-${SELECTED}`).addClass('failed');
                for (let i = 0; i < 10; i++) {
                    if (GAME_STATE.solution.words[SELECTED][i]) $(`#word-${SELECTED}-letter-${i}`).html(`<p>${GAME_STATE.solution.words[SELECTED][i]}</p>`);
                }
                ChangeSelectedWord(SELECTED + 1);
                $(`#word-${SELECTED}-letter-0`).html(`<p>${GAME_STATE.solution.words[SELECTED][0]}</p>`);
            } else {
                // there's still letters to reveal, so reveal one
                $(`#word-${SELECTED}-letter-${GAME_STATE.states[SELECTED].guesses}`).html(`<p>${GAME_STATE.solution.words[SELECTED][GAME_STATE.states[SELECTED].guesses]}</p>`);
            }
            can_interact = true;
        }, 750);
    }

    setTimeout(() => {
        if (!can_interact) return;
        $('#entry').val('');
        $('#entry')[0].dispatchEvent(new InputEvent('input'));
        if (!PLAYING_PREVIOUS) {
            localStorage.setItem('chains_states', JSON.stringify(GAME_STATE.states));
            localStorage.setItem('chains_current', `${SELECTED}`);
            localStorage.setItem('chains_last_played_date', DATE);
        }
    }, 760);
}


// TODO:
// sharing doesn't work
// needs all sorts of sharing and polishing css

// wait for document to load
console.log('chains/main -- waiting for document to load...');
$(async function() {
    ResetGame();
    const load_success = await LoadPuzzle(DATE);
    if (!load_success) {
        console.error('chains/main -- LoadPuzzle returned false, puzzle has failed to load.');
        alert(`Failed to load the puzzle for ${DATE}. This is not your fault.`);
    }
    RenderPuzzle();
    ChangeSelectedWord(1);

    if (localStorage.getItem('chains_last_played_date') == DATE) {
        LoadLocalStorageData();
    }

    console.log("%c Hey! Cheating gets rid of the fun!", "background: red; color: yellow; font-size: x-large");
    console.log("%c You've got this! Keep trying!", "color: green; font-size: large");
    console.log("%c Encountered an issue? Report it (with screenshots of the logs) at https://github.com/okawaffles/chains/issues", "color: rgb(18,138,250); font-size: medium");
    console.log("%c  Developers, source maps are included if you are interested in poking around!", "color: rgb(18,138,250)");

    can_interact = true;

    // input listener
    $('#enter').on('click', () => {
        if (($('#entry').val() as string).trim() != '') AttemptEntry();
    });
    $(document).on('keydown', (ev) => {
        if (ev.key == 'Enter' && $('#entry').is(':focus') && ($('#entry').val() as string).trim() != '') AttemptEntry();
    });
    $('#entry').on('input', () => {
        // forces the shown letters to start the guess
        let shown_letters = GAME_STATE.solution.words[SELECTED].substring(0, GAME_STATE.states[SELECTED].guesses + 1);
        if (!($('#entry').val() as string).trim().startsWith(shown_letters) || ($('#entry').val() as string).trim() == '') $('#entry').val(shown_letters);
    });

    $('#entry')[0].dispatchEvent(new InputEvent('input'));

    $('#share-button').on('click', () => {
        const shared = GenerateShare();
        if (navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone')) {
            try {
                if (!navigator.canShare()) {
                    navigator.clipboard.writeText(shared);
                    $('#share-button').text('Copied Results!');
                    setTimeout(() => {
                        $('#share-button').text('Share Results');
                    }, 3000);
                }
                navigator.share({text:shared});
            } catch (err) {
                console.warn(`chains/main -- navigator was unable to share: ${err}`);
                navigator.clipboard.writeText(shared);
                $('#share-button').text('Copied Results!');
                setTimeout(() => {
                    $('#share-button').text('Share Results');
                }, 3000);
            }
        } else {
            navigator.clipboard.writeText(shared);
            $('#share-button').text('Copied Results!');
            setTimeout(() => {
                $('#share-button').text('Share Results');
            }, 3000);
        }
    });
    $('#load-other').on('click', async () => {
        const chosen_date = new Date(prompt('Enter a date between 2025-07-30 and now.')!);
        if (chosen_date.toString() == 'Invalid Date') return alert('Invalid date chosen.');

        const new_diff = chosen_date.getTime() - n.getTime();
        NUMBER = Math.floor(new_diff / 86400000) + 1;
        alert(`new number is ${NUMBER}`);
        if (NUMBER > TODAY_NUMBER) {
            alert('Cannot load a puzzle that is newer than today\'s.');
            return this.location.reload();
        }

        DATE = chosen_date.toISOString().split('T')[0];

        PLAYING_PREVIOUS = true;
        ResetGame();
        const load_prev_success = await LoadPuzzle(DATE);
        if (!load_prev_success) {
            alert('Failed to load the puzzle on this date.');
            return this.location.reload();
        }
        RenderPuzzle();
        ChangeSelectedWord(1);
        $('#entry')[0].dispatchEvent(new InputEvent('input'));
        $('#controls').css('display', 'flex');
        $('#share').css('display', 'none');
        $('#final-text').css('display', 'none');
        can_interact = true;
    });
});