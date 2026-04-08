# Overview
HexRex is a logical tabletop game.

# Game setup
The board consists of 9x9 hex grid.
Two players play the game
Players go in turns

# Hex Placement
- In a turn a player can eiter place a hex to an empty hex or remove one of their own placed hex.
- There is a special placement rule: in every direction, when new hex is placed, it must match the number of already placed hexes.
- So if a player has two hexes connected, from East, and wants to place new hex to East or West, they must be able to place 2 hexes.
- A hex can not be placed over another player's hex, over own hex, or over the game board.
- A player can remove only 1 hex from the edges of they hex group.

# Capture
- When a player's hexes are surrounded completely by another player hexes so he could not reach the edge of the board, consider those hexes captured

# Goal
Goal: capture as many enemy hexes as possible or max territory, when board is full.

# Implementation
- Draw a simple board
- Player can interact with mouse, click board to place, remove hex.
- Use different colors for players.
- Add a "Start new game" button that will start the game

# Rules Clarification Questions

## 1. Turn structure
Question: On a turn, does a player choose exactly one action total: either place or remove, but not both?

Answer: Yes, only one action per turn. After action is done, the next player moves. Just like in chess

## 2. Placement count rule
Question: Does "it must match the number of already placed hexes" mean the player must place multiple hexes in the same turn, or does it mean a single placement is only legal if the line length in that direction equals some existing connected count?

Answer: when a player hovers over hexes to place their own, the required amount of hexes in that direction should be displayed by highlighting the cells where it will be placed. So if player needs to place 3 hexes, highlight the 3 hexes where it will be placed. A placement move itself is independent from the number of hexes placed. 

## 3. Direction scope
Question: For the special placement rule, does "in every direction" refer to the 6 hex-grid directions only, and is the count checked from the newly placed hex outward, from the existing group outward, or across the full line on both sides?

Answer: Yes, to the 6 hex grid directions. and from the existing group outward

## 4. Multi-placement shape
Question: If a move requires placing multiple hexes, must those hexes be contiguous in a straight line, and must they all be placed in one chosen direction?

Answer: Yes.

## 5. Partial legality
Question: If a required multi-hex placement would partly go off the board or collide with occupied cells, is the whole move illegal, or can the player place only the legal subset?

Answer: the whole move is illegal

## 6. Removal rule
Question: What exactly counts as "the edges of they hex group"? Is a removable hex any owned hex adjacent to at least one empty cell, and must removing it leave the remaining group connected?

Answer: Exactly.

## 7. Multiple groups
Question: Can a player control multiple disconnected groups at the same time, or must all of their placed hexes remain part of one connected group?

Answer: Can control multiple disconnected. The player can not remove a single hex that was placed. So any hex groups can be reduced only to 1 hex, but not to 0

## 8. Capture timing
Question: When are captures resolved: immediately after every placement, immediately after every removal, or only at the end of a full turn?

Answer: immediatelly after placement

## 9. Captured pieces
Question: What happens to captured hexes? Are they removed from the board, converted to the capturing player's color, or kept in place but counted as captured score?

Answer: converted to the capturing players color, but with a different gradient so it is visually visible that those were capture

## 10. Edge reach definition
Question: For capture, does "reach the edge of the board" mean connected through orthogonally adjacent hexes of the same player only, or through any chain including empty cells?

Answer: through any chain including empty cells. so captured means completely surrounded by enemy from every direction

## 11. Self-capture and mutual capture
Question: Can a player make a move that causes their own group to become captured, and if both players would become captured from the same move, how is that resolved?

Answer: no, player can not place his own hex that would make it immediatelly capture. if both players would captured immediatelly, the outer capturer wins

## 12. Scoring
Question: Is the winner determined only by number of captured enemy hexes, only by controlled territory when the board is full, or by a combination of both?

Answer: combination. the game ends when a player is unable to make another move, because there is no room on the board for legal moves, and placing a hex would be either illegal or made it immediatelly captured.

## 13. Territory definition
Question: If territory matters, how is territory measured: number of occupied hexes, enclosed empty hexes, reachable area, or something else?

Answer: number of occupied hexes

## 14. End condition
Question: Does the game end only when the board is full, or can it also end earlier when neither player has a legal move or when one player cannot avoid loss?

Answer: Can end earlier if one player can not move. 

## 15. Starting position and first move
Question: Does the game start with an empty board, and if so are there any special restrictions or advantages for the first player?

Answer: game start with empty board. no advantages

# Further Clarification Questions

## 16. Placement source group selection
Question: When a player has multiple disconnected groups, which group determines the required placement length for a move? Is it always the group adjacent to the highlighted placement line?

Answer: the adjacent. 

## 17. Empty-board first move
Question: On the very first move of the game, and on the first move of a newly created one-hex group, what placement length is required? Should a single hex be placeable when there is no existing line length yet?

Answer: for a first move, or on an empty hex on the board, always place 1 hex. Single hex can be placed if it is not connected to own group. Single hex can be placed next to enemy group, the special rule doesnt apply to enemy groups

## 18. Exact line-length rule
Question: For a placement in one direction, is the required number of new hexes equal to the exact count of already owned contiguous hexes in the opposite direction, or in the same direction starting from the anchor group?

Answer: from the already owned hexes from the opposit direction. Example a line of three hexes: XXX and adding a new to this group would look: XXXxxx 

## 19. Valid anchor for placement
Question: Must every placement start adjacent to one of the current player's existing hexes, or can a new disconnected group be created by placing into any empty area that satisfies the count rule?

Answer: player can place single hex to empty areas that satisfy count rule

## 20. Capture scope
Question: When a placement causes capture, are only enemy hexes converted, or can enclosed empty cells also become territory immediately in some way?

Answer: only enemy

## 21. Chain capture resolution
Question: If converting captured enemy hexes causes a second capture elsewhere, should captures continue resolving in a chain until the board is stable?

Answer: yes

## 22. Removal and capture
Question: Since capture resolves immediately after placement, never after removal, can a player legally remove a hex even if that removal would leave an enemy group surrounded?

Answer: explain this scenario more, i dont understand the question

## 23. No-move end condition
Question: Does the game end as soon as the active player has no legal move on their turn, or only when both players consecutively have no legal moves?

Answer: as soon as the active player

## 24. Winner calculation
Question: At game end, how should the winner be determined from the "combination" of captures and occupied hexes? For example, is it total owned hexes on board, captured count as a separate score, or a weighted formula?

Answer: display all info at the end of the game, determine by total hex count, but captured cells worth double

## 25. Tie handling
Question: If both players have the same final score, what is the tie-break rule?

Answer: which one captured more. if that is the tie, which one has the longest consecutive hex group. if that is the same, the game is a tie

# Final Clarification Questions

## 26. Removal scenario clarification
Question: Example: after Player A removes one of their own edge hexes, an enemy group becomes fully surrounded with no path to the board edge. Since capture normally resolves only after placement, should that enemy group remain uncaptured until a later placement, or should removal-triggered captures also happen immediately?

Answer: I dont understand if Player A removes their own hex from the edge, that would open a path to the edge, so how would it make enemy group surrounded?

## 27. Free single-hex placement rule
Question: You wrote that a single hex can be placed on an empty area if it "satisfy count rule." For a completely disconnected placement, what exact rule must be satisfied beyond the cell being empty and on the board?

Answer: nothing else.

## 28. Captured-hex ownership and scoring persistence
Question: Once a captured enemy hex is converted and marked with the capture gradient, does it remain worth double for the rest of the game even if it later becomes part of another capture chain or is adjacent to newly placed normal hexes?

Answer: it remains. 

## 29. Removing captured hexes
Question: Can a player remove one of their own previously captured-gradient hexes using the normal edge-removal rule, or are captured hexes locked in place?

Answer: captured hexes are converted to the capturers owned hexes. so original player can not do anything with them, but new owner can remove them, losing the double value if he choose to. Also placing own hex next to the captured hexes now considers the special placing rule, since those captured hex belong to the new owner now

## 30. Longest consecutive group definition
Question: For the final tie-break, does "longest consecutive hex group" mean the largest connected group by hex adjacency, or the longest straight-line chain in one of the 6 board directions?

Answer: longest straight-line chain in one ofth 6 board direction. 

## 31. Can removal ever trigger capture?
Question: Concrete example: suppose an enemy group currently has exactly one escape path to the board edge, and that path goes through one of your own edge hexes. If you remove a different one of your own edge hexes and that changes connectivity so the enemy no longer has any path to the edge, should the enemy be captured immediately, or are captures checked only after placement moves and never after removals?

Answer: I still can not imagine this scenario. lets get back to this when there is a visual board implemented and draw this scenario
