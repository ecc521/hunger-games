// contestCommon.js (v1.1)

(function() {
  var contest = {};

  var agents, agentGraveyard;
  var capital;

  contest.init = function (agentCount, cb) {
    // Create an agent object for each agent
    agents = [];
    agentGraveyard = [];
    for (var i = 0; i < agentCount; i++) {
      var agent = { id: i };
      if (typeof cb == "function") { cb(agent, i); }
      agents.push(agent);
    }

    // Populate each agent with the inital state
    agents.forEach(function (agent) {
      agent.food = 300 * agents.length;

      agent.rounds = 0;
      agent.hunts = 0;
      agent.reputation = 0.5;

      agent.huntsToday = 0;

      agent.results = {};
      agent.foodResults = {};

      agent.history = {};
      agents.forEach(function (agent2) {
        if (agent.id != agent2.id) {
          agent.history[agent2.id] = [];
        }
      });
    });

    // Set the capital object
    capital = {
      blessingThreshold: 1,
      day: 0,

      blessingThresholdHistory: [],
      huntParticipationHistory: [],

      initialPlayers: agents.length,
      currentPlayers: agents.length
    };
  };


  var agentQueue = [];

  contest.startDay = function () {
    capital.day++;

    let availableBlessingOdds = 1 / (1 + (capital.day / 1000)) //Decrease odds gradually with day.
    //console.log("Blessing odds: " + availableBlessingOdds)
    if (Math.random() < (0.05) * availableBlessingOdds) {
        capital.blessingThreshold = -0.1 //Guaranteed
    }
    else if (Math.random() < availableBlessingOdds*0.95) {
        capital.blessingThreshold = Math.random()
    }
    else {
        capital.blessingThreshold = 1.1 //Impossible
    }
    //console.log("Blessing Threshold: " + capital.blessingThreshold)

    agents.forEach(function (agent) {
      agentQueue.push(agent);
    });
  };

  contest.next = function () {
    return agentQueue.pop();
  };

  contest.finishedDay = function () {
    // Process all agents
    var totalRounds = 0;
    var totalRoundHunts = 0;

    agents.forEach(function (agent) {
      agent.huntsToday = 0;
      agent.bonusFood = 0;
      agent.foodOutcome = 0;
    });

    for (var i = 0; i < agents.length; i++) {
      var a1 = agents[i];

      for (var j = i + 1; j < agents.length; j++) {
        var a2 = agents[j];

        var a1r = a1.results[a2.id];
        var a2r = a2.results[a1.id];

        // Add rounds
        a1.rounds++; totalRounds++;
        a2.rounds++; totalRounds++;

        // Adjust food for hunts
        let huntBurns = 6
        let huntEarns = 5.6
        let slackBurns = 2.2

        let food1 = 0, food2 = 0;

        var foodEarned = 0;
        if (a1r == 'h') { foodEarned += huntEarns; food1 -= huntBurns; a1.hunts++; a1.huntsToday++; totalRoundHunts++; }
        else { food1 -= slackBurns; }
        if (a2r == 'h') { foodEarned += huntEarns; food2 -= huntBurns; a2.hunts++; a2.huntsToday++; totalRoundHunts++; }
        else { food2 -= slackBurns; }

        food1 += (foodEarned / 2);
        food2 += (foodEarned / 2);

        food1 = Math.round(food1 * 1000) / 1000
        food2 = Math.round(food2 * 1000) / 1000

        a1.foodOutcome += food1
        a2.foodOutcome += food2

        a1.foodOutcome = Math.round(a1.foodOutcome * 1000) / 1000
        a2.foodOutcome = Math.round(a2.foodOutcome * 1000) / 1000

        a1.foodResults[a2.id] = food1
        a2.foodResults[a1.id] = food2

        // Save history
        a1.history[a2.id].push(a1r);
        a2.history[a1.id].push(a2r);
      }
    }

    // Provide food outcome string
    agents.forEach(function (agent) {
      agent.food += agent.foodOutcome;
      agent.food = Math.round(agent.food * 1000) / 1000

      if (agent.foodOutcome >= 0) { agent.foodOutcomeString = "+" + agent.foodOutcome; }
      else { agent.foodOutcomeString = "" + agent.foodOutcome; }
    });


    // Check capital blessingThreshold
    let blessingReward = 2

    if (totalRoundHunts > capital.blessingThreshold * totalRounds) {
      contest.extraFoodWon = true;
      agents.forEach(function (agent) {
        agent.food += agent.huntsToday * blessingReward;
        agent.bonusFood = agent.huntsToday * blessingReward;
      });
    } else {
      contest.extraFoodWon = false;
      agents.forEach(function (agent) {
        agent.bonusFood = 0;
      });
    }

    // Update agents for next round, removing agents with 0 food
    var nextRound = [];
    thisRoundGraveyard = [];
    agents.forEach(function (agent) {
      // Update rep
      agent.reputation = agent.hunts / agent.rounds;

      if (agent.food <= 0) {
        agent.lastDay = capital.day;
        agentGraveyard.push(agent);
      } else {
        nextRound.push(agent);
      }
    });

    agents = nextRound;

    // Update capital history data
    capital.currentPlayers = agents.length;
    capital.blessingThresholdHistory.push( capital.blessingThreshold );
    capital.huntParticipationHistory.push( (totalRoundHunts / totalRounds) );
  };

  contest.each = function(cb) {
    for (var i = 0; i < agents.length; i++) {
      cb(agents[i], i)
    }
  };

  contest.hunterData = function (agent, partner) {
    return {
      food: agent.food,
      reputation: agent.reputation,
      history: agent.history[partner.id]
    };
  };

  contest.capitalData = function() {
    return capital;
  };

  contest.count = function() {
    return agents.length;
  };

  contest.getAgent = function (index) {
    if (index < 0 || index >= agents.length) {
      console.log("Bad index: " + index + " / " + agents.length);
      return undefined;
    } else {
      return agents[index];
    }
  };

  contest.getAgents = function() {
    return agents;
  };

  contest.extraFoodWon = false;

  contest.getWinner = function () {
    if (agents.length == 1) { return agents[0]; }
    else if (agents.length == 0) {
      agentGraveyard.sort(function (a, b) {
        if (a.lastDay < b.lastDay) {
          // b lasted longer, b is better
          return 1;
        } else if (b.lastDay < a.lastDay) {
          // a lasted longer, a is better
          return -1;
        } else if (a.food < b.food) {
          // b has more food, b is better
          return 1;
        } else if (b.food < a.food) {
          // a has more food, a is better
          return -1;
        } else {
          return 0;
        }
      });
      return agentGraveyard[0];
    } else {
      return undefined;
    }
  };

  if (typeof window != "undefined") { window.contest = contest; }
  if (typeof module != "undefined") { module.exports = contest; }
}());
