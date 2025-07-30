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
const DATE = d.toISOString().split('T')[0];
console.log(`chains/main -- the date is ${DATE}`);

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
    const response = await fetch(`/puzzle/${date}`);
    
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

function FinishGame() {
    alert('congrats i havent made win screen yet so heres a trophy 🏆');
}

function GenerateShare() {
    let shared = `millie.zone Chains ${DATE}\n`;
    for (let i = 1; i < GAME_STATE.states.length - 1; i++) {
        if (GAME_STATE.states[i].solved) {
            for (let e = 0; e < GAME_STATE.states[i].guesses - 1; e++) {
                shared += '❌';
            }
            shared += '✅\n';
        } else {
            for (let e = 0; e < GAME_STATE.states[i].guesses - 1; e++) {
                shared += '❌';
            }
            shared += '🚫\n';
        }
    }
    shared += 'https://millie.zone/chains';
    return shared;
}

// TODO:
// sharing doesn't work
// needs all sorts of sharing and polishing css

// wait for document to load
console.log('chains/main -- waiting for document to load...');
let can_interact = false;
$(async function() {
    ResetGame();
    await LoadPuzzle(DATE);
    RenderPuzzle();
    ChangeSelectedWord(1);

    console.log("%c Hey! Cheating gets rid of the fun! ", "background: red; color: yellow; font-size: x-large");
    console.log("%c You've got this! Keep trying! ", "color: green; font-size: large");
    console.log("%c Encountered an issue? Report it (with screenshots of the logs) at https://github.com/okawaffles/chains/issues ", "color: rgb(18,138,250); font-size: medium");

    can_interact = true;

    // input listener
    $('#enter').on('click', () => {
        if (!can_interact) return;
        can_interact = false;
        const solution_word = GAME_STATE.solution.words[SELECTED];
        if ($('#entry').val() == solution_word) {
            // yes
            for (let i = 0; i < solution_word.length; i++) {
                $(`#word-${SELECTED}-letter-${i}`).css('animation', '.75s guess-correct ease-in-out');
                setTimeout(() => {
                    $(`#word-${SELECTED}-letter-${i}`).html(`<p>${solution_word[i]}</p>`);
                }, 750/2);
                setTimeout(() => {
                    $(`#word-${SELECTED}-letter-${i}`).css('animation', 'none');
                }, 750);
            }
            setTimeout(() => {
                GAME_STATE.states[SELECTED].solved = true;
                ChangeSelectedWord(SELECTED + 1);
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
    });
});