// Initialize jsPsych
const jsPsych = initJsPsych({
    override_safe_mode: true,
    on_finish: function(data) {
        console.log('Experiment complete');
        console.log(data.csv());
    }
});

// Global variables
let manifestData = [];
let practiceTrialsC = [];
let practiceTrialsP = [];
let mainTrialsC = [];
let mainTrialsP = [];
let groupOrder; // 'CP' or 'PC'

// Consent page
const consent = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <div class="consent-text">
            <h2>Consent to Participate in Research</h2>
            <p><strong>Study Title:</strong> Image Recognition and Production Task</p>
            <p><strong>Principal Investigator:</strong> [Your Name]</p>
            <p><strong>Institution:</strong> [Your Institution]</p>
            
            <h3>Purpose of the Study</h3>
            <p>This study investigates how people recognize and produce labels for images. You will complete two types of tasks: selecting the correct image from multiple options, and typing what you see in single images.</p>
            
            <h3>What You Will Do</h3>
            <p>The experiment will take approximately 15-20 minutes. You will:</p>
            <ul>
                <li>Complete basic demographic questions</li>
                <li>Complete practice trials to familiarize yourself with the tasks</li>
                <li>Complete two blocks of experimental trials</li>
            </ul>
            
            <h3>Risks and Benefits</h3>
            <p>There are no known risks associated with this study. Your participation will contribute to our understanding of visual recognition and language production.</p>
            
            <h3>Confidentiality</h3>
            <p>Your responses will be kept confidential. No identifying information will be collected.</p>
            
            <h3>Voluntary Participation</h3>
            <p>Your participation is entirely voluntary. You may withdraw at any time without penalty.</p>
            
            <p><strong>By clicking "I Agree" below, you indicate that you have read and understood this information and agree to participate in this study.</strong></p>
        </div>
    `,
    choices: ['I Agree', 'I Do Not Agree'],
    on_finish: function(data) {
        if (data.response === 1) { // "I Do Not Agree"
            jsPsych.endExperiment('Thank you. The experiment has been terminated.');
        }
    }
};

// Demographics
const demographics = {
    type: jsPsychSurveyHtmlForm,
    html: `
        <div class="demographics-form">
            <h2>About You</h2>
            <div class="form-group">
                <label for="age">Age:</label>
                <select name="age" id="age" required>
                    <option value="">Select age</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                </select>
            </div>
            <div class="form-group">
                <label for="gender">Gender:</label>
                <select name="gender" id="gender" required>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="form-group">
                <label for="english_first">Is English your first language?</label>
                <select name="english_first" id="english_first" required>
                    <option value="">Select option</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                </select>
            </div>
        </div>
    `
};

// Function to load and process manifest
function loadManifest() {
    return new Promise((resolve, reject) => {
        // Use the embedded manifest data
        manifestData = MANIFEST_DATA;
        processManifestData();
        resolve();
    });
}

function processManifestData() {
    // Separate practice and main trials
    const practiceTrials = manifestData.filter(trial => trial.difficulty === 0);
    const mainTrials = manifestData.filter(trial => trial.difficulty !== 0);

    // Group main trials by difficulty
    const trialsByDifficulty = {};
    mainTrials.forEach(trial => {
        if (!trialsByDifficulty[trial.difficulty]) {
            trialsByDifficulty[trial.difficulty] = [];
        }
        trialsByDifficulty[trial.difficulty].push(trial);
    });

    // Process practice trials - evenly split between C and P
    const shuffledPracticeTrials = jsPsych.randomization.shuffle(practiceTrials);
    const practiceMiddle = shuffledPracticeTrials.length / 2;

    practiceTrialsC = shuffledPracticeTrials.slice(0, practiceMiddle);
    practiceTrialsP = shuffledPracticeTrials.slice(practiceMiddle);

    // Process main trials by difficulty level
    const difficultyLevels = Object.keys(trialsByDifficulty).sort((a, b) => parseInt(a) - parseInt(b));
    
    difficultyLevels.forEach(difficulty => {
        const trials = trialsByDifficulty[difficulty];
        const shuffled = jsPsych.randomization.shuffle(trials);
        const midpoint = shuffled.length / 2;
        
        mainTrialsC.push(...shuffled.slice(0, midpoint));
        mainTrialsP.push(...shuffled.slice(midpoint));
    });

    // Determine random group order
    groupOrder = Math.random() < 0.5 ? 'CP' : 'PC';
}

// Create 4AFC trial
function createComprehensionTrial(trialData) {
    const images = [trialData.target, trialData.distractor1, trialData.distractor2, trialData.distractor3];
    const shuffledImages = jsPsych.randomization.shuffle(images);
    const correctIndex = shuffledImages.indexOf(trialData.target);

    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: `<h3>Which image shows: "${trialData.label}"?</h3>`,
        choices: shuffledImages,
        button_html: (choice) => {
            return `<button class="jspsych-btn"><img src="${choice}" /></button>`
        },
        button_layout: "grid",
        grid_rows: 2,
        grid_columns: 2,
        data: {
            task: 'comprehension',
            label: trialData.label,
            difficulty: trialData.difficulty,
            correct_answer: correctIndex + 1,
            target_image: trialData.target,
            presented_images: shuffledImages,
            group_order: groupOrder
        },
        on_finish: function(data) {
            data.correct = data.response === correctIndex;
            console.log(data);
        }
    };
}

// Create production trial
function createProductionTrial(trialData) {
    return {
        type: jsPsychSurveyHtmlForm,
        html: `
            <h3>What do you see in this image?</h3>
            <div class="single-image">
                <img src="${trialData.target}">
            </div>
            <div class="text-input">
                <input id="prod-input" type="text" name="response" required>
            </div>
        `,
        data: {
            task: 'production',
            label: trialData.label,
            difficulty: trialData.difficulty,
            target_image: trialData.target,
            group_order: groupOrder
        },
        on_load: function() {
            // Wait for DOM to fully render, then focus
            const input = document.getElementById('prod-input');
            if (input) input.focus();
        },
        on_finish: function(data) {
            const response = data.response.response.toLowerCase().trim();
            const correct = trialData.label.toLowerCase().trim();
            const all_responses = response.split("/");
            const final_response = all_responses[all_responses.length - 1];
            data.participant_response = response;
            data.final_response = final_response;
            data.correct_response = correct;
            data.correct = final_response === correct;
            console.log(data);
        }
    };
}

// Instructions for each task type
const instructions4AFC = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Instructions: Matching Task</h2>
        <p>In this task, you will see four images and a word. Your job is to choose the image that matches the word.</p>
        <p>First, you'll do a few practice trials to get familiar with the task.</p>
        <p>Click "Continue" when you're ready to start the practice.</p>
    `,
    choices: ['Continue']
};

const instructionsProduction = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Instructions: Naming Task</h2>
        <p>In this task, you will see a single image. Your job is to say what you see in the image.</p>
        <p>First, you'll do a few practice trials to get familiar with the task.</p>
        <p>Click "Continue" when you're ready to start the practice.</p>
    `,
    choices: ['Continue']
};

// Break between groups
const betweenGroupsBreak = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Great job!</h2>
        <p>You've completed the first part of the experiment.</p>
        <p>Now you'll do a different type of task. Take a short break if you need one.</p>
        <p>Click "Continue" when you're ready for the next part.</p>
    `,
    choices: ['Continue']
};

// Final screen
const final = {
    type: jsPsychHtmlButtonResponse,
    stimulus: `
        <h2>Thank you!</h2>
        <p>You have completed the experiment. Thank you for your participation!</p>
        <p>You may now close this window.</p>
    `,
    choices: ['Finish']
};

// Build timeline
async function buildTimeline() {
    await loadManifest();
    
    const testing = false;
    let timeline = [];
    if (testing) {
        groupOrder = 'CP';
    } else {
        timeline.push(demographics);
    }

    if (groupOrder === 'CP') {
        // C group first (4AFC)
        timeline.push(instructions4AFC);
        timeline.push(...practiceTrialsC.map(trial => createComprehensionTrial(trial)));
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>Practice complete! Now starting the main task.</p>',
            choices: ['Continue']
        });
        timeline.push(...mainTrialsC.map(trial => createComprehensionTrial(trial)));
        
        timeline.push(betweenGroupsBreak);
        
        // P group second (Production)
        timeline.push(instructionsProduction);
        timeline.push(...practiceTrialsP.map(trial => createProductionTrial(trial)));
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>Practice complete! Now starting the main task.</p>',
            choices: ['Continue']
        });
        timeline.push(...mainTrialsP.map(trial => createProductionTrial(trial)));
    } else {
        // P group first (Production)
        timeline.push(instructionsProduction);
        timeline.push(...practiceTrialsP.map(trial => createProductionTrial(trial)));
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>Practice complete! Now starting the main task.</p>',
            choices: ['Continue']
        });
        timeline.push(...mainTrialsP.map(trial => createProductionTrial(trial)));
        
        timeline.push(betweenGroupsBreak);
        
        // C group second (4AFC)
        timeline.push(instructions4AFC);
        timeline.push(...practiceTrialsC.map(trial => createComprehensionTrial(trial)));
        timeline.push({
            type: jsPsychHtmlButtonResponse,
            stimulus: '<p>Practice complete! Now starting the main task.</p>',
            choices: ['Continue']
        });
        timeline.push(...mainTrialsC.map(trial => createComprehensionTrial(trial)));
    }

    timeline.push(final);
    return timeline;
}

// Run the experiment
buildTimeline().then(timeline => {
    jsPsych.run(timeline);
});