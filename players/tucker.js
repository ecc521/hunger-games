"use strict";

var player = {
  // Enter the name of this player in CS 105's Hunger Games
  // (When submitted, this `name` WILL appear on the contest page.  You can
  // use whatever name you would like, it should probably not be your real name,
  // but it should be clean and not disrespectful.)
  name: "Tucker",

  // Program the makeDecision function to play in the contest!
  makeDecision: function(me, partner, capital) {
      let huntWithMe = partner.history.reduce((sum, current) => {return sum + (current === "h"?1:0)}, 0)
      let reputationWithMe = huntWithMe / partner.history.length

      if (capital.currentPlayers === 2) {return "s"} //Always slack at the end. If we are behind, we may need to try and abuse their algorithm if they don't do this too (if they do, we lose). 

      //Hunting on capital days is always the best move for us.
      if (capital.blessingThreshold < Math.min(...(capital.huntParticipationHistory.slice(-2)))) {
          return "h"
      }

      if (partner.reputation === 1 && partner.history.length > 3) {
          return "s" //Slack against always hunters.
      }

      if (reputationWithMe < 0.6 && partner.history.length > 6) {
          return "s" //Looks like randomness.

      }

      //TFT
    return partner.history[partner.history.length - 1] || "h"
  }
};




//
// The following hooks your agent into the pool of existing agents and is
// required to run as part of the contest.  None of these lines have errors
// and you should not edit them.
//
// If the JavaScript console reports an error on the very last line of the file,
// the root cause of this is likely a bracket or brace that you opened but
// did not close somewhere inside of your player.
//
if (typeof module != "undefined") { module.exports = player };
if (typeof window != "undefined") {
  if (typeof window.players == "undefined") { window.players = []; }
  window.players.push(player);
}
