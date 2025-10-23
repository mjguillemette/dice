# PS1 Horror Bedroom - Controls & Functions

## Keyboard Controls

### Camera Controls
- **C** - Toggle between Cinematic and Free Camera modes
  - **Cinematic Mode**: Auto-rotating camera through 10 predefined angles
  - **Free Camera Mode**: First-person WASD movement

- **N** - Next camera angle (Cinematic mode only)
  - Manually advance to the next cinematic angle
  - Resets the auto-rotation timer

### Free Camera Controls (Free Camera Mode Only)
- **W** - Move forward
- **S** - Move backward
- **A** - Move left (strafe)
- **D** - Move right (strafe)
- **Mouse Movement** - Look around (requires pointer lock)

### Corruption Controls
- **Q** - Decrease corruption level manually
  - Decreases hellFactor by 5%
  - Disables auto-corruption

- **E** - Increase corruption level manually
  - Increases hellFactor by 5%
  - Disables auto-corruption

- **T** - Toggle auto-corruption on/off
  - When ON: Corruption automatically cycles between 0% and 100%
  - When OFF: Corruption level is frozen at current value

### UI Controls
- **H** - Hide/Show Dev Panel
  - Toggles the developer panel visibility
  - Panel shows real-time status and available controls

## Combat Controls

-   **UI Interaction**: After the dice have settled, player actions (such as attacking or defending) are selected from the on-screen UI.
-   The available actions are determined by the values of the settled dice.

## Cinematic Camera Angles

1. **Bedroom Overview** - Wide establishing shot from corner
2. **Bed Detail** - Close-up of bed where teddy bear corrupts
3. **Ceiling Light** - Looking up at the transforming light fixture
4. **Window Corruption** - View of window turning blood red
5. **Desk Lamp** - Bureau and lamp close-up
6. **TV Screen** - TV screen transformation view
7. **Floor Decay** - Low dramatic angle across floor and rug
8. **Room Descent** - High corner showing full room corruption
9. **Wall Corruption** - Close-up of wall textures and decay
10. **Ascension** - Dramatic low angle looking up at ceiling

## Corruption System

### Auto-Corruption
- Speed: 0.0003 per frame
- Cycles automatically between 0% and 100%
- Direction reverses at 0% and 100%

### Manual Corruption
- Press Q/E to control manually
- Automatically disables auto-corruption
- Press T to re-enable auto-corruption

### Corruption Stages

| Stage | Range | Visual Effects |
|-------|-------|----------------|
| **DUST** | 0-30% | Light dust particles appear on surfaces |
| **GRIME** | 20-50% | Dirt, stains, and mold spread across room |
| **RUST** | 40-70% | Rust and oxidation appear on metals |
| **BLOOD** | 60-90% | Blood stains and veins emerge from surfaces |
| **PULSE** | 80-100% | Pulsating demonic energy throughout room |

## Dev Panel Information

The dev panel displays:
- **Current camera mode** (Cinematic/Free Cam)
- **Current camera angle name** (in cinematic mode)
- **Corruption level** (0-100%)
- **Auto-corruption status** (ON/OFF)
- **Active corruption stages** (highlighted in red)
- **Available keyboard controls** (context-sensitive)
- **Visual corruption bar** (color-coded by severity)

## Tips

- Start in **Cinematic Mode** to see all the carefully crafted camera angles
- Switch to **Free Camera** to explore the room on your own
- Use **Manual Corruption** (Q/E) to freeze the scene at specific corruption levels
- Press **H** if you need to see the controls reminder
- Watch the **Corruption Bar** to see which stages are active

## Technical Notes

- Free camera movement is bounded within the room (-4.5 to 4.5 in X/Z)
- Cinematic angles transition smoothly over 2 seconds
- Each cinematic angle holds for 8 seconds before auto-advancing
- Mouse look in free camera mode requires pointer lock (click the canvas)
