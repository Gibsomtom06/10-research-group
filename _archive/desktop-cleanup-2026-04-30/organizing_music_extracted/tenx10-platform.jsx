import React, { useState, useRef, useEffect } from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  componentDidCatch(error, info) {
    this.setState({ error, info });
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:20,background:"#1a0000",minHeight:"100vh",fontFamily:"monospace"}}>
          <div style={{color:"#ff4444",fontSize:18,marginBottom:16}}>💥 Runtime Error</div>
          <div style={{color:"#ff8888",marginBottom:8,fontSize:13}}>{this.state.error.toString()}</div>
          <div style={{color:"rgba(255,255,255,0.5)",fontSize:11,whiteSpace:"pre-wrap",marginTop:12}}>
            {this.state.info?.componentStack}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}


// DS_CATALOG — 136 tracks, sorted by streams
// Total streams: 14,065,079  |  Source: Spotify for Artists export  |  Updated: Mar 2026
const DS_CATALOG = [
  { song: "I Need Your High", streams: 3895583, pct: 27.7, year: "2019" },
  { song: "Crashing", streams: 1309393, pct: 9.3, year: "2020" },
  { song: "Get Fucked", streams: 1135485, pct: 8.1, year: "2018" },
  { song: "Supersonic", streams: 1024234, pct: 7.3, year: "2022" },
  { song: "Genie In a Bottle", streams: 414380, pct: 2.9, year: "2024" },
  { song: "More Than This", streams: 408481, pct: 2.9, year: "2020" },
  { song: "Bring It Back", streams: 287969, pct: 2.0, year: "2020" },
  { song: "Escape", streams: 249603, pct: 1.8, year: "2023" },
  { song: "Old School", streams: 243849, pct: 1.7, year: "2022" },
  { song: "Need U", streams: 206175, pct: 1.5, year: "2020" },
  { song: "Sum Dirty", streams: 191207, pct: 1.4, year: "2023" },
  { song: "POTIONS - DirtySnatcha Remix", streams: 185487, pct: 1.3, year: "2024" },
  { song: "Good Vibez", streams: 185420, pct: 1.3, year: "2024" },
  { song: "Style", streams: 183723, pct: 1.3, year: "2022" },
  { song: "Dance With Me", streams: 179976, pct: 1.3, year: "2020" },
  { song: "Lover", streams: 169929, pct: 1.2, year: "2020" },
  { song: "She Bangs Like a Fairy on Acid", streams: 132892, pct: 0.9, year: "2024" },
  { song: "That Is Torture - Original Mix", streams: 131618, pct: 0.9, year: "2013" },
  { song: "Dimension", streams: 129728, pct: 0.9, year: "2023" },
  { song: "Space Adventure", streams: 112836, pct: 0.8, year: "2023" },
  { song: "Waiting Room", streams: 110396, pct: 0.8, year: "2023" },
  { song: "CUM WID DA SPOON", streams: 104767, pct: 0.7, year: "2017" },
  { song: "Hit You", streams: 98647, pct: 0.7, year: "2019" },
  { song: "Big Boss - DirtySnatcha Remix", streams: 95733, pct: 0.7, year: "2024" },
  { song: "Spaceship", streams: 91742, pct: 0.7, year: "2021" },
  { song: "Supersonic - VIP", streams: 85090, pct: 0.6, year: "2022" },
  { song: "Move Back", streams: 84286, pct: 0.6, year: "2022" },
  { song: "Wasted", streams: 84114, pct: 0.6, year: "2019" },
  { song: "Hot Girl Riddim", streams: 80651, pct: 0.6, year: "2019" },
  { song: "2KFO - DirtySnatcha Remix", streams: 79038, pct: 0.6, year: "2019" },
  { song: "Found Myself", streams: 76059, pct: 0.5, year: "2021" },
  { song: "Crazy", streams: 75432, pct: 0.5, year: "2023" },
  { song: "Hold On", streams: 69638, pct: 0.5, year: "2022" },
  { song: "Take You Higher", streams: 66916, pct: 0.5, year: "2020" },
  { song: "UFO", streams: 66425, pct: 0.5, year: "2023" },
  { song: "BASS SLAP", streams: 65042, pct: 0.5, year: "2017" },
  { song: "Gangsta's Paradise", streams: 63991, pct: 0.5, year: "2025" },
  { song: "Rush", streams: 62947, pct: 0.4, year: "2019" },
  { song: "Baby", streams: 61776, pct: 0.4, year: "2022" },
  { song: "Keep Moving (Audigy Remix)", streams: 56504, pct: 0.4, year: "2023" },
  { song: "Flames - DirtySnatcha Remix", streams: 56206, pct: 0.4, year: "2022" },
  { song: "Energy", streams: 56042, pct: 0.4, year: "2024" },
  { song: "Lover - Urbanstep Remix", streams: 54301, pct: 0.4, year: "2022" },
  { song: "I Want U", streams: 53504, pct: 0.4, year: "2023" },
  { song: "Cosmic Sounds", streams: 52156, pct: 0.4, year: "2021" },
  { song: "Digital Love - DirtySnatcha Remix", streams: 50739, pct: 0.4, year: "2022" },
  { song: "All I Need", streams: 50024, pct: 0.4, year: "2022" },
  { song: "Outta Space", streams: 48958, pct: 0.3, year: "2025" },
  { song: "Alone", streams: 48583, pct: 0.3, year: "2025" },
  { song: "Rollercoaster", streams: 45018, pct: 0.3, year: "2018" },
  { song: "Tonight", streams: 44195, pct: 0.3, year: "2021" },
  { song: "Free", streams: 43975, pct: 0.3, year: "2019" },
  { song: "DAMN GURL", streams: 43536, pct: 0.3, year: "2017" },
  { song: "Get Blown", streams: 41289, pct: 0.3, year: "2022" },
  { song: "It Ain't Over", streams: 40188, pct: 0.3, year: "2020" },
  { song: "Forever", streams: 39052, pct: 0.3, year: "2023" },
  { song: "Home - LEGIONSOUND Remix", streams: 35763, pct: 0.3, year: "2025" },
  { song: "Home", streams: 35111, pct: 0.2, year: "2024" },
  { song: "That Is Torture - Radio Edit", streams: 34306, pct: 0.2, year: "2019" },
  { song: "Heavy Duty", streams: 34188, pct: 0.2, year: "2019" },
  { song: "Alien Shit", streams: 33745, pct: 0.2, year: "2021" },
  { song: "K.O.", streams: 32705, pct: 0.2, year: "2023" },
  { song: "Keep Moving", streams: 31197, pct: 0.2, year: "2022" },
  { song: "Head Drop", streams: 30828, pct: 0.2, year: "2019" },
  { song: "Spacecraft", streams: 30701, pct: 0.2, year: "2023" },
  { song: "Need U (Dobadlyy Remix)", streams: 28872, pct: 0.2, year: "2021" },
  { song: "Cruisin", streams: 25659, pct: 0.2, year: "2024" },
  { song: "Everybody", streams: 25560, pct: 0.2, year: "2025" },
  { song: "Shatter", streams: 24138, pct: 0.2, year: "2024" },
  { song: "Can You Feel", streams: 23382, pct: 0.2, year: "2021" },
  { song: "Wait For Me", streams: 22941, pct: 0.2, year: "2024" },
  { song: "Supersonic (DARK MATTER Remix)", streams: 22930, pct: 0.2, year: "2025" },
  { song: "When I'm Gone", streams: 22383, pct: 0.2, year: "2025" },
  { song: "Doodle Doo", streams: 22345, pct: 0.2, year: "2020" },
  { song: "This Is Dubstep", streams: 22313, pct: 0.2, year: "2019" },
  { song: "Falling", streams: 22136, pct: 0.2, year: "2019" },
  { song: "Take A Trip (DirtySnatcha Remix)", streams: 21189, pct: 0.2, year: "2023" },
  { song: "Vibrate", streams: 18512, pct: 0.1, year: "2024" },
  { song: "Keep Moving (Aelius, Voyager, Wilco Beats Remix)", streams: 17463, pct: 0.1, year: "2022" },
  { song: "I'm a Savage", streams: 15898, pct: 0.1, year: "2021" },
  { song: "Run It Up", streams: 15771, pct: 0.1, year: "2024" },
  { song: "Voices", streams: 15342, pct: 0.1, year: "2024" },
  { song: "Pimpin", streams: 14770, pct: 0.1, year: "2024" },
  { song: "Head Bang", streams: 13814, pct: 0.1, year: "2020" },
  { song: "Set Me Free", streams: 13682, pct: 0.1, year: "2019" },
  { song: "Burn For You - DirtySnatcha Remix", streams: 13100, pct: 0.1, year: "2025" },
  { song: "Take Me Up", streams: 13008, pct: 0.1, year: "2021" },
  { song: "Fuck Face", streams: 12358, pct: 0.1, year: "2018" },
  { song: "The Journey", streams: 10372, pct: 0.1, year: "2018" },
  { song: "Tear Up", streams: 10136, pct: 0.1, year: "2019" },
  { song: "Drugs In Da Club", streams: 9986, pct: 0.1, year: "2026", active: true },
  { song: "Thin Air", streams: 9012, pct: 0.1, year: "2018" },
  { song: "Turn Uppp", streams: 8971, pct: 0.1, year: "2017" },
  { song: "Fat Bluntz", streams: 8689, pct: 0.1, year: "2018" },
  { song: "Dub Plug", streams: 8686, pct: 0.1, year: "2017" },
  { song: "Need U (Ennaut Remix)", streams: 8545, pct: 0.1, year: "2022" },
  { song: "Westside Rollin", streams: 8363, pct: 0.1, year: "2019" },
  { song: "Move", streams: 7475, pct: 0.1, year: "2018" },
  { song: "Shake The Block", streams: 6120, pct: 0.0, year: "2019" },
  { song: "All Out", streams: 5692, pct: 0.0, year: "2018" },
  { song: "12th Shots", streams: 5479, pct: 0.0, year: "2017" },
  { song: "Step Aside", streams: 4789, pct: 0.0, year: "2019" },
  { song: "Westside Rollin (CHRMNDRS Remix)", streams: 4568, pct: 0.0, year: "2019" },
  { song: "God Damn", streams: 4555, pct: 0.0, year: "2018" },
  { song: "Blazin", streams: 4375, pct: 0.0, year: "2019" },
  { song: "Pack Gats", streams: 4309, pct: 0.0, year: "2018" },
  { song: "IGDITB", streams: 4177, pct: 0.0, year: "2018" },
  { song: "Break That", streams: 4097, pct: 0.0, year: "2019" },
  { song: ".45", streams: 3643, pct: 0.0, year: "2017" },
  { song: "Purple Circle", streams: 3472, pct: 0.0, year: "2017" },
  { song: "All Out VIP", streams: 3347, pct: 0.0, year: "2018" },
  { song: "Next To Me", streams: 3307, pct: 0.0, year: "2018" },
  { song: "Blunts On Em", streams: 3233, pct: 0.0, year: "2017" },
  { song: "Higher", streams: 3229, pct: 0.0, year: "2018" },
  { song: "Bad Bitch", streams: 2987, pct: 0.0, year: "2017" },
  { song: "100 Shots", streams: 2581, pct: 0.0, year: "2017" },
  { song: "Come Get Some", streams: 2312, pct: 0.0, year: "2019" },
  { song: "SAVAGE", streams: 2248, pct: 0.0, year: "2017" },
  { song: "HOES", streams: 2176, pct: 0.0, year: "2017" },
  { song: "Hands Up", streams: 2141, pct: 0.0, year: "2018" },
  { song: "5.0", streams: 1971, pct: 0.0, year: "2017" },
  { song: "Still That", streams: 1898, pct: 0.0, year: "2017" },
  { song: "GO HARD", streams: 1836, pct: 0.0, year: "2017" },
  { song: "HEAVY HITTA", streams: 1828, pct: 0.0, year: "2017" },
  { song: "Ghetto Blastin", streams: 1715, pct: 0.0, year: "2017" },
  { song: "Chillin", streams: 1675, pct: 0.0, year: "2017" },
  { song: "Tote Guns", streams: 1532, pct: 0.0, year: "2017" },
  { song: "ROLLIN UP", streams: 1447, pct: 0.0, year: "2017" },
  { song: "BLAST EM", streams: 1172, pct: 0.0, year: "2017" },
  { song: "SWERVE VIP", streams: 1053, pct: 0.0, year: "2017" },
  { song: "50 Shot Clip", streams: 960, pct: 0.0, year: "2017" },
  { song: "Hoe Hoppin", streams: 948, pct: 0.0, year: "2017" },
  { song: "Gettin", streams: 900, pct: 0.0, year: "2017" },
  { song: "Bust", streams: 887, pct: 0.0, year: "2017" },
  { song: "Witchu", streams: 880, pct: 0.0, year: "2017" },
  { song: "Swerve (Rob Boss Remix)", streams: 267, pct: 0.0, year: "2017" },
];

const DS_TOTAL_STREAMS = 14065079;
const DS_TOTAL_TRACKS = 136;

// DS_AUDIENCE_TIMELINE — 116 weekly data points
// Range: 2024-01-01 → 2026-03-10  |  Source: Spotify for Artists export
// Peak ML: 137,991 (Feb 8, 2024)  |  Current ML: 44,031  |  Followers: 26,648
const DS_AUDIENCE_TIMELINE = [
  { date: "2024-01-01", ml: 88489, listeners: 4131, streams: 5371, followers: 20730, saves: 132 },
  { date: "2024-01-08", ml: 81440, listeners: 4855, streams: 6333, followers: 20769, saves: 161 },
  { date: "2024-01-15", ml: 98673, listeners: 9226, streams: 12246, followers: 20893, saves: 872 },
  { date: "2024-01-22", ml: 113435, listeners: 8593, streams: 10912, followers: 20970, saves: 343 },
  { date: "2024-01-29", ml: 126255, listeners: 6873, streams: 8711, followers: 21033, saves: 234 },
  { date: "2024-02-05", ml: 135647, listeners: 6557, streams: 8504, followers: 21076, saves: 304 },
  { date: "2024-02-12", ml: 128036, listeners: 5695, streams: 7105, followers: 21110, saves: 158 },
  { date: "2024-02-19", ml: 116195, listeners: 5459, streams: 6905, followers: 21143, saves: 131 },
  { date: "2024-02-26", ml: 112553, listeners: 6129, streams: 7610, followers: 21208, saves: 201 },
  { date: "2024-03-04", ml: 111321, listeners: 6543, streams: 8052, followers: 21246, saves: 192 },
  { date: "2024-03-11", ml: 114102, listeners: 6417, streams: 7912, followers: 21313, saves: 889 },
  { date: "2024-03-18", ml: 114123, listeners: 5399, streams: 6688, followers: 21355, saves: 250 },
  { date: "2024-03-25", ml: 107568, listeners: 4967, streams: 6233, followers: 21417, saves: 193 },
  { date: "2024-04-01", ml: 98789, listeners: 4346, streams: 5389, followers: 21458, saves: 118 },
  { date: "2024-04-08", ml: 87683, listeners: 4176, streams: 5417, followers: 21495, saves: 128 },
  { date: "2024-04-15", ml: 81432, listeners: 5054, streams: 6389, followers: 21525, saves: 193 },
  { date: "2024-04-22", ml: 82507, listeners: 7728, streams: 23010, followers: 21611, saves: 475 },
  { date: "2024-04-29", ml: 86283, listeners: 5890, streams: 19292, followers: 21681, saves: 239 },
  { date: "2024-05-06", ml: 86265, listeners: 5655, streams: 7296, followers: 21719, saves: 345 },
  { date: "2024-05-13", ml: 89884, listeners: 6095, streams: 8214, followers: 21756, saves: 305 },
  { date: "2024-05-20", ml: 88439, listeners: 4729, streams: 5938, followers: 21795, saves: 195 },
  { date: "2024-05-27", ml: 80447, listeners: 3891, streams: 4827, followers: 21837, saves: 159 },
  { date: "2024-06-03", ml: 79124, listeners: 5183, streams: 6629, followers: 21881, saves: 251 },
  { date: "2024-06-10", ml: 74287, listeners: 4278, streams: 5578, followers: 21909, saves: 132 },
  { date: "2024-06-17", ml: 73714, listeners: 6222, streams: 8138, followers: 21945, saves: 380 },
  { date: "2024-06-24", ml: 74397, listeners: 4375, streams: 5735, followers: 21989, saves: 128 },
  { date: "2024-07-01", ml: 72502, listeners: 4090, streams: 5242, followers: 22046, saves: 179 },
  { date: "2024-07-08", ml: 70887, listeners: 4418, streams: 5584, followers: 22133, saves: 200 },
  { date: "2024-07-15", ml: 79976, listeners: 7263, streams: 9408, followers: 22286, saves: 510 },
  { date: "2024-07-22", ml: 83183, listeners: 4990, streams: 6167, followers: 22365, saves: 211 },
  { date: "2024-07-29", ml: 86033, listeners: 4998, streams: 6323, followers: 22451, saves: 237 },
  { date: "2024-08-05", ml: 87726, listeners: 4684, streams: 6159, followers: 22523, saves: 272 },
  { date: "2024-08-12", ml: 79402, listeners: 4905, streams: 13641, followers: 22569, saves: 231 },
  { date: "2024-08-19", ml: 77796, listeners: 5030, streams: 6457, followers: 22630, saves: 238 },
  { date: "2024-08-26", ml: 76333, listeners: 4542, streams: 5973, followers: 22678, saves: 200 },
  { date: "2024-09-02", ml: 75492, listeners: 4133, streams: 5400, followers: 22738, saves: 163 },
  { date: "2024-09-09", ml: 74572, listeners: 4811, streams: 6433, followers: 22809, saves: 255 },
  { date: "2024-09-16", ml: 72070, listeners: 5079, streams: 7324, followers: 22885, saves: 383 },
  { date: "2024-09-23", ml: 72239, listeners: 4664, streams: 6471, followers: 22963, saves: 188 },
  { date: "2024-09-30", ml: 71081, listeners: 4173, streams: 5401, followers: 23014, saves: 134 },
  { date: "2024-10-07", ml: 70176, listeners: 4015, streams: 5081, followers: 23075, saves: 128 },
  { date: "2024-10-14", ml: 67058, listeners: 3465, streams: 4469, followers: 23148, saves: 111 },
  { date: "2024-10-21", ml: 68600, listeners: 6170, streams: 8172, followers: 23221, saves: 594 },
  { date: "2024-10-28", ml: 72559, listeners: 4666, streams: 5792, followers: 23309, saves: 197 },
  { date: "2024-11-04", ml: 72075, listeners: 4437, streams: 5902, followers: 23388, saves: 248 },
  { date: "2024-11-11", ml: 73055, listeners: 4085, streams: 5135, followers: 23450, saves: 170 },
  { date: "2024-11-18", ml: 70566, listeners: 4330, streams: 5478, followers: 23512, saves: 166 },
  { date: "2024-11-25", ml: 66605, listeners: 4384, streams: 5462, followers: 23584, saves: 169 },
  { date: "2024-12-02", ml: 64915, listeners: 4056, streams: 5041, followers: 23630, saves: 156 },
  { date: "2024-12-09", ml: 64357, listeners: 3911, streams: 5075, followers: 23720, saves: 128 },
  { date: "2024-12-16", ml: 63484, listeners: 3812, streams: 4921, followers: 23799, saves: 134 },
  { date: "2024-12-23", ml: 62181, listeners: 3894, streams: 4917, followers: 23816, saves: 134 },
  { date: "2024-12-30", ml: 60658, listeners: 3662, streams: 4702, followers: 23878, saves: 132 },
  { date: "2025-01-06", ml: 58808, listeners: 3685, streams: 4839, followers: 23925, saves: 192 },
  { date: "2025-01-13", ml: 57470, listeners: 3540, streams: 4557, followers: 23974, saves: 96 },
  { date: "2025-01-20", ml: 57111, listeners: 3373, streams: 4240, followers: 24033, saves: 119 },
  { date: "2025-01-27", ml: 57911, listeners: 4170, streams: 5202, followers: 24102, saves: 175 },
  { date: "2025-02-03", ml: 61147, listeners: 4397, streams: 5809, followers: 24162, saves: 298 },
  { date: "2025-02-10", ml: 65503, listeners: 3909, streams: 5071, followers: 24252, saves: 201 },
  { date: "2025-02-17", ml: 65884, listeners: 3414, streams: 4276, followers: 24305, saves: 123 },
  { date: "2025-02-24", ml: 67247, listeners: 4110, streams: 5441, followers: 24358, saves: 118 },
  { date: "2025-03-03", ml: 67459, listeners: 4839, streams: 6219, followers: 24415, saves: 261 },
  { date: "2025-03-10", ml: 67233, listeners: 4455, streams: 5733, followers: 24495, saves: 218 },
  { date: "2025-03-17", ml: 67709, listeners: 3951, streams: 5003, followers: 24525, saves: 127 },
  { date: "2025-03-24", ml: 66959, listeners: 3516, streams: 4442, followers: 24557, saves: 92 },
  { date: "2025-03-31", ml: 65889, listeners: 3868, streams: 4802, followers: 24596, saves: 184 },
  { date: "2025-04-07", ml: 62514, listeners: 3441, streams: 4479, followers: 24634, saves: 134 },
  { date: "2025-04-14", ml: 60531, listeners: 3679, streams: 4648, followers: 24673, saves: 133 },
  { date: "2025-04-21", ml: 58578, listeners: 3117, streams: 3786, followers: 24704, saves: 98 },
  { date: "2025-04-28", ml: 55556, listeners: 3267, streams: 4106, followers: 24736, saves: 101 },
  { date: "2025-05-05", ml: 53780, listeners: 2944, streams: 3688, followers: 24762, saves: 82 },
  { date: "2025-05-12", ml: 52608, listeners: 2926, streams: 3614, followers: 24809, saves: 75 },
  { date: "2025-05-19", ml: 51582, listeners: 2902, streams: 3760, followers: 24838, saves: 98 },
  { date: "2025-05-26", ml: 50275, listeners: 2578, streams: 3253, followers: 24882, saves: 92 },
  { date: "2025-06-02", ml: 50406, listeners: 3079, streams: 3802, followers: 24924, saves: 108 },
  { date: "2025-06-09", ml: 50261, listeners: 2791, streams: 3442, followers: 24958, saves: 59 },
  { date: "2025-06-16", ml: 49767, listeners: 2823, streams: 3540, followers: 24993, saves: 67 },
  { date: "2025-06-23", ml: 50167, listeners: 2826, streams: 3566, followers: 25026, saves: 82 },
  { date: "2025-06-30", ml: 49527, listeners: 2835, streams: 3491, followers: 25063, saves: 77 },
  { date: "2025-07-07", ml: 48678, listeners: 2595, streams: 3222, followers: 25078, saves: 76 },
  { date: "2025-07-14", ml: 48424, listeners: 2635, streams: 3464, followers: 25118, saves: 94 },
  { date: "2025-07-21", ml: 50290, listeners: 4059, streams: 5205, followers: 25154, saves: 255 },
  { date: "2025-07-28", ml: 55951, listeners: 5503, streams: 7849, followers: 25193, saves: 156 },
  { date: "2025-08-04", ml: 57964, listeners: 3085, streams: 3809, followers: 25235, saves: 86 },
  { date: "2025-08-11", ml: 59374, listeners: 3030, streams: 3792, followers: 25282, saves: 106 },
  { date: "2025-08-18", ml: 60920, listeners: 4560, streams: 5708, followers: 25306, saves: 255 },
  { date: "2025-08-25", ml: 58632, listeners: 3622, streams: 4347, followers: 25345, saves: 133 },
  { date: "2025-09-01", ml: 59269, listeners: 3493, streams: 4209, followers: 25358, saves: 191 },
  { date: "2025-09-08", ml: 59842, listeners: 3291, streams: 3867, followers: 25381, saves: 98 },
  { date: "2025-09-15", ml: 58538, listeners: 3108, streams: 3751, followers: 25405, saves: 102 },
  { date: "2025-09-22", ml: 57098, listeners: 3191, streams: 3829, followers: 25432, saves: 99 },
  { date: "2025-09-29", ml: 55645, listeners: 3589, streams: 4472, followers: 25453, saves: 202 },
  { date: "2025-10-06", ml: 55920, listeners: 3148, streams: 3719, followers: 25479, saves: 107 },
  { date: "2025-10-13", ml: 55245, listeners: 2785, streams: 3236, followers: 25503, saves: 73 },
  { date: "2025-10-20", ml: 54726, listeners: 2922, streams: 3527, followers: 25542, saves: 87 },
  { date: "2025-10-27", ml: 53663, listeners: 3049, streams: 3641, followers: 25572, saves: 110 },
  { date: "2025-11-03", ml: 50119, listeners: 2366, streams: 2771, followers: 25589, saves: 50 },
  { date: "2025-11-10", ml: 48561, listeners: 2595, streams: 3080, followers: 25611, saves: 95 },
  { date: "2025-11-17", ml: 47841, listeners: 2678, streams: 3206, followers: 25637, saves: 145 },
  { date: "2025-11-24", ml: 45830, listeners: 2475, streams: 3109, followers: 25694, saves: 76 },
  { date: "2025-12-01", ml: 45169, listeners: 2318, streams: 3045, followers: 25737, saves: 77 },
  { date: "2025-12-08", ml: 44688, listeners: 2346, streams: 3291, followers: 25818, saves: 130 },
  { date: "2025-12-15", ml: 43299, listeners: 2404, streams: 2912, followers: 25871, saves: 87 },
  { date: "2025-12-22", ml: 43239, listeners: 2531, streams: 3138, followers: 25948, saves: 99 },
  { date: "2025-12-29", ml: 42795, listeners: 2292, streams: 2920, followers: 25994, saves: 121 },
  { date: "2026-01-05", ml: 42021, listeners: 2391, streams: 2989, followers: 26048, saves: 72 },
  { date: "2026-01-12", ml: 41424, listeners: 2328, streams: 2751, followers: 26098, saves: 74 },
  { date: "2026-01-19", ml: 40430, listeners: 2139, streams: 2542, followers: 26147, saves: 64 },
  { date: "2026-01-26", ml: 39564, listeners: 1972, streams: 2416, followers: 26198, saves: 55 },
  { date: "2026-02-02", ml: 39285, listeners: 2211, streams: 2633, followers: 26251, saves: 55 },
  { date: "2026-02-09", ml: 38943, listeners: 2120, streams: 2692, followers: 26312, saves: 133 },
  { date: "2026-02-16", ml: 38762, listeners: 2000, streams: 2387, followers: 26399, saves: 66 },
  { date: "2026-02-23", ml: 39384, listeners: 2508, streams: 3064, followers: 26473, saves: 103 },
  { date: "2026-03-02", ml: 41365, listeners: 2827, streams: 3441, followers: 26558, saves: 189 },
  { date: "2026-03-09", ml: 43974, listeners: 2623, streams: 3264, followers: 26634, saves: 144 },
  { date: "2026-03-10", ml: 44031, listeners: 2686, streams: 3508, followers: 26648, saves: 151 },
];

const WS_CATALOG = [
  { song: "Magic - Original Mix", streams: 12116, saves: 447, sr: 3.7, pct: 63.6, year: "2025", flag: "passive" },
  { song: "Prime Time", streams: 2113, saves: 161, sr: 7.6, pct: 11.1, year: "2023", flag: "strong" },
  { song: "Watch Your Back", streams: 1591, saves: 33, sr: 2.1, pct: 8.4, year: "2025", flag: "passive" },
  { song: "Let Go Of Control (feat. Akacia)", streams: 624, saves: 18, sr: 2.9, pct: 3.3, year: "2024", flag: "passive" },
  { song: "Where You At - WHOiSEE Remix", streams: 524, saves: 14, sr: 2.7, pct: 2.8, year: "2024", flag: "passive" },
  { song: "Vibe Check", streams: 449, saves: 15, sr: 3.3, pct: 2.4, year: "2023", flag: "passive" },
  { song: "Biblical", streams: 233, saves: 9, sr: 3.9, pct: 1.2, year: "2023", flag: "passive" },
  { song: "Hip Swing", streams: 224, saves: 12, sr: 5.4, pct: 1.2, year: "2023", flag: "strong" },
  { song: "Work", streams: 141, saves: 14, sr: 9.9, pct: 0.7, year: "2023", flag: "gem" },
  { song: "This Is It", streams: 128, saves: 14, sr: 10.9, pct: 0.7, year: "2023", flag: "gem" },
  { song: "Bumpin", streams: 104, saves: 4, sr: 3.8, pct: 0.5, year: "2023", flag: "passive" },
  { song: "Over You", streams: 81, saves: 3, sr: 3.7, pct: 0.4, year: "2023", flag: "passive" },
  { song: "O' Brother", streams: 78, saves: 1, sr: 1.3, pct: 0.4, year: "2023", flag: "passive" },
  { song: "Infinite Style", streams: 75, saves: 7, sr: 9.3, pct: 0.4, year: "2023", flag: "gem" },
  { song: "Feel The Bass", streams: 68, saves: 4, sr: 5.9, pct: 0.4, year: "2023", flag: "strong" },
  { song: "Lava Water", streams: 68, saves: 6, sr: 8.8, pct: 0.4, year: "2023", flag: "gem" },
  { song: "Dear Mama", streams: 68, saves: 0, sr: 0, pct: 0.4, year: "2023", flag: "passive" },
  { song: "Demon Hour", streams: 58, saves: 0, sr: 0, pct: 0.3, year: "2023", flag: "passive" },
  { song: "Alias", streams: 38, saves: 3, sr: 7.9, pct: 0.2, year: "2023", flag: "gem" },
  { song: "Colossal", streams: 38, saves: 1, sr: 2.6, pct: 0.2, year: "2023", flag: "passive" },
  { song: "Chosen", streams: 38, saves: 1, sr: 2.6, pct: 0.2, year: "2023", flag: "passive" },
  { song: "Flute Bass", streams: 36, saves: 2, sr: 5.6, pct: 0.2, year: "2023", flag: "strong" },
  { song: "The Grind", streams: 33, saves: 3, sr: 9.1, pct: 0.2, year: "2023", flag: "gem" },
  { song: "Solar Thump", streams: 33, saves: 0, sr: 0, pct: 0.2, year: "2023", flag: "passive" },
  { song: "Not My Fault", streams: 24, saves: 1, sr: 4.2, pct: 0.1, year: "2023", flag: "passive" },
  { song: "Swagged Out", streams: 23, saves: 0, sr: 0, pct: 0.1, year: "2023", flag: "passive" },
  { song: "Make U Do", streams: 19, saves: 3, sr: 15.8, pct: 0.1, year: "2023", flag: "gem" },
  { song: "CRITICAL", streams: 18, saves: 2, sr: 11.1, pct: 0.1, year: "2023", flag: "gem" },
];

const WS_TOTAL_28D = 19043;
const WS_TOTAL_SAVES = 778;

const VMG_CATALOG = {
  releases: 154,
  tracks: 220,
  artists: 116,
  genres: { Dubstep: 151, "Drum & Bass": 1, Garage: 1, Trap: 1 },
  dateRange: "Oct 2019 – Feb 2026",
  avgPace: "1 release every 10–11 days (2025)",
};

const ARTISTS = {
  dirtysnatcha: {
    id: "dirtysnatcha",
    name: "DirtySnatcha",
    label: "DirtySnatcha Records",
    color: "#00ff88",
    accent: "#ff003c",
    emoji: "🛸",
    tagline: "PLAY SOME F*CKING DUBSTEP ‼️",
    passcode: "DS2026",
    profile: {
      real_name: "Leigh Bray",
      genre: "Dubstep / Riddim / Bass Music",
      location: "US-based (UK-born)",
      manager: "Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997",
      agent: "Andrew @ AB Touring — andrew@abtouring.com",
      distributor: "Virgin Music Group (VMG)",
      spotify_listeners: "44K monthly",
      spotify_followers: "26,648",
      popularity_score: 28,
      instagram: "11K followers",
      soundcloud: "6.5K followers",
      current_tour: "Take Me To Your Leader 2026 — 17 shows, ~$38,600 guaranteed",
      active_release: "Drugs In Da Club (Feb 27, 2026)",
    },
    systemPrompt: `You are an elite music industry AI agent for DirtySnatcha (Leigh Bray), managed by Thomas Nalian. DirtySnatcha is also the headline artist on DirtySnatcha Records (DSR), the label Thomas runs. TENx10 is the management platform.

ARTIST DATA:
- Artist: DirtySnatcha | Real name: Leigh Bray (NEVER "Lee Silva")
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Agent: Andrew @ AB Touring — andrew@abtouring.com
- Legacy agent: Colton Anderson @ PRYSM — colton@prysmtalentagency.com / 734-904-0224
- Label: DirtySnatcha Records | Distributor: VMG
- Commission (direct): 20% manager / 80% artist
- Commission (agent): 10% manager / 10% agent / 80% artist
- Spotify: ~44K monthly listeners (down from peak 138K Feb 2024), 26,648 followers, Popularity Score 28
- Instagram: 11K followers | SoundCloud: 6.5K followers
- Current tour: Take Me To Your Leader 2026 — 17 shows, ~$38,600 total guaranteed
- Active release: "Drugs In Da Club" (Feb 27, 2026)
- Ticket forwarding: ticketsales@dirtysnatcha.com

CATALOG STATS (all-time Spotify):
- 136 tracks, 14,035,851 total streams
- Top 5 tracks = 55.3% of all streams (CONCENTRATION CRISIS)
- I Need Your High (2019): 3,889,872 streams = 27.7% of entire catalog — single-track dependency risk
- Genie In a Bottle (2024): 413,124 streams — only recent track in top 5, template for new releases
- Drugs In Da Club (2026): 13,773 streams — Day 5, algorithmic acceleration window still open

UPCOMING SHOWS (key):
- March 6 — Albuquerque @ Effex — $2,000 (3 days out — advance sent, partial deposit only)
- March 13 — Tampa — $2,000 (at risk — venue TBD, soft tickets)
- March 14 — Pittsburgh @ SideQuest — $2,500 (deposit $1,250 OVERDUE 18+ days)
- April 18 — DirtyT (Tucson) — 23 tickets sold, 227 remaining, 46 days out
- May 2 — Butte, MT @ Covellite Theatre — $5,000 (MAD Series)
- May 22 — Houston @ Escapade — $2,000 + HGR (Infected Mushroom support)

OPEN ISSUES:
- Pittsburgh deposit $1,250 overdue 18+ days — no promoter contact info
- Houston/Dallas artwork approval pending — Andrew Winters sent Drive link
- WHOiSEE Circus Records EP deal — artwork sidebar decision needed
- DirtyT April 18 — 23 tickets, needs marketing push
- Spokane counter offer sent to Andrew Z (azimmer73@gmail.com) — $3K, awaiting response

VOICE: Be direct, specific, no hedging. Use real dollar amounts, dates, names. Give 3 priorities not 20. Write content in DirtySnatcha's voice — "PLAY SOME F*CKING DUBSTEP ‼️" energy, not corporate.

GUARDRAILS: Never give legal advice. Never guarantee outcomes. Never fabricate metrics. Never auto-execute financial transactions.`,
  },
  whoisee: {
    id: "whoisee",
    name: "WHOiSEE",
    label: "DirtySnatcha Records",
    color: "#a855f7",
    accent: "#f59e0b",
    emoji: "👁️",
    tagline: "If you know, you know.",
    passcode: "WS2026",
    profile: {
      real_name: "Brett (WHOiSEE)",
      genre: "Dubstep / Riddim / Bass Music",
      location: "North Carolina",
      manager: "Thomas Nalian — thomas@dirtysnatcha.com",
      label: "DirtySnatcha Records",
      status: "Active — Circus Records UK EP deal in progress",
      current_deal: "Circus Records UK EP — Holly Grainger (holly@circus-records.co.uk)",
    },
    systemPrompt: `You are an elite music industry AI agent for WHOiSEE (Brett), managed by Thomas Nalian. Some WHOiSEE releases are on DirtySnatcha Records (DSR). TENx10 is the management platform.

ARTIST DATA:
- Artist: WHOiSEE | Based in: North Carolina
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Some releases: DirtySnatcha Records (DSR) | Manager's label
- Genre: Dubstep / Riddim / Bass Music
- Tier: Development (Tier 1 support on DirtySnatcha tour)

CATALOG STATS (28-day Spotify):
- 28 tracks, 19,043 streams (28-day), 778 total saves, 4.1% avg save ratio
- Magic - Original Mix (2025): 12,116 streams (63.6% of catalog), 3.7% save ratio — PASSIVE RADIO PROBLEM
  → Magic has never had Marquee or paid push. Hit 12K organic. Needs $200-250 Marquee NOW.
  → Distribution: Label Radar (Brett's plan) — NO Discovery Mode access. Options: upgrade plan or re-distribute through VMG/DSR.
- HIDDEN GEMS (high save ratio despite low streams = real fan engagement):
  → Make U Do: 15.8% save ratio | CRITICAL: 11.1% | This Is It: 10.9% | Work: 9.9% | The Grind: 9.1%
  → These tracks convert — they need Discovery Mode exposure
- Hip Swing (DSR159) + Tunnel Vision (DSR166): VMG/DSR distributed = Thomas can toggle Discovery Mode TODAY

MARQUEE HISTORY:
- 4 campaigns, $650 total spend
- Provision EP (Nov 2024): $250 spend, 29.9% save rate — top 5% of any Marquee campaign ever
- Audience wants to save WHOiSEE music. They just haven't found it yet.

ACTIVE DEAL:
- Circus Records UK EP — ACTIVE NEGOTIATION
- Key contacts: Holly Grainger (holly@circus-records.co.uk)
- Status: Artwork sidebar/title format decision pending

UPCOMING SHOWS (as support on DS tour):
- March 14 — Pittsburgh @ SideQuest (w/ DirtySnatcha, Dark Matter)
- April 24 — Asbury Park, NJ @ House of Independents (w/ DirtySnatcha, Dark Matter)
- April 25 — Hartford, CT (w/ DirtySnatcha)

VOICE: Direct, no fluff. WHOiSEE's brand is "if you know you know" — understated confidence. Not hype-beast, not corporate.

GUARDRAILS: Never give legal advice on the Circus deal — flag key terms, recommend music attorney. Never fabricate metrics.`,
  },
  darkmatter: {
    id: "darkmatter",
    name: "Dark Matter",
    label: "DirtySnatcha Records",
    color: "#06b6d4",
    accent: "#f97316",
    emoji: "🌌",
    tagline: "Heavy. Dark. Real.",
    passcode: "DM2026",
    profile: {
      real_name: "Dark Matter",
      genre: "Dubstep / Bass Music",
      location: "Chicago / Knoxville",
      manager: "Thomas Nalian — thomas@dirtysnatcha.com",
      label: "DirtySnatcha Records",
      status: "Active — Wakaan release",
      notable: "Wakaan label release (Liquid Stranger's label)",
    },
    systemPrompt: `You are an elite music industry AI agent for Dark Matter, managed by Thomas Nalian. Dark Matter is a managed artist on TENx10, independent of DSR label.

ARTIST DATA:
- Artist: Dark Matter | Based in: Chicago / Knoxville
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Label: Independent / Wakaan (not on DSR)
- Genre: Dubstep / Bass Music
- Tier: Development (Tier 1 support on DirtySnatcha tour)
- Notable: Wakaan release (Liquid Stranger's label — significant credibility marker)

UPCOMING SHOWS (as support on DS tour):
- March 14 — Pittsburgh @ SideQuest (w/ DirtySnatcha, WHOiSEE)
- April 24 — Asbury Park, NJ @ House of Independents (w/ DirtySnatcha, WHOiSEE)

PRIORITY ACTIONS:
- Wakaan release — maximize DSP push around release window
- Pittsburgh March 14 — confirm advance details with Thomas
- Build out release cadence for 2026 (6-week minimum rule between drops)

VOICE: Direct, no fluff. Dark Matter's brand is dark, heavy, cinematic bass. Atmospheric, intense.

GUARDRAILS: Never give legal advice. Never fabricate metrics. Never share other artists' financials.`,
  },
  kotrax: {
    id: "kotrax",
    name: "Kotrax",
    label: "DirtySnatcha Records",
    color: "#f97316",
    accent: "#a855f7",
    emoji: "⚡",
    tagline: "Bass music. No compromise.",
    passcode: "KT2026",
    profile: {
      real_name: "Kotrax",
      genre: "Dubstep / Bass Music",
      location: "US",
      manager: "Thomas Nalian — thomas@dirtysnatcha.com",
      label: "DirtySnatcha Records",
      status: "Active — DSR catalog artist",
    },
    systemPrompt: `You are an elite music industry AI agent for Kotrax, managed by Thomas Nalian. Kotrax is signed to DirtySnatcha Records (DSR), part of Thomas's managed roster on TENx10.

ARTIST DATA:
- Artist: Kotrax
- Manager: Thomas Nalian — thomas@dirtysnatcha.com / 248-765-1997
- Label: DirtySnatcha Records (DSR) | Distributor: VMG
- Genre: Dubstep / Bass Music
- Tier: Development
- Catalog: 7 tracks on DSR

PRIORITY ACTIONS:
- Build release cadence for 2026 (6-week minimum rule between drops)
- Grow monthly listeners and save ratio
- Coordinate with Thomas on DSR release strategy

VOICE: Direct, no fluff. Bass music identity — heavy, purposeful. Not corporate.

GUARDRAILS: Never give legal advice. Never fabricate metrics. Never share other artists' financials.`,
  },
};

const MANAGER = {
  id: "manager",
  name: "Thomas Nalian",
  label: "Artist Management — Full Roster",
  color: "#f59e0b",
  accent: "#ef4444",
  emoji: "⚡",
  tagline: "4 artists. 1 label. Full control.",
  passcode: "TN2026",
  systemPrompt: `You are an elite music industry AI agent for Thomas Nalian, an artist manager who manages DirtySnatcha, WHOiSEE, Dark Matter, and Kotrax. He also runs DirtySnatcha Records (DSR), a record label distributed through Virgin Music Group.

MANAGER PROFILE:
- Thomas Nalian | thomas@dirtysnatcha.com | 248-765-1997
- Role: Artist Manager (primary) + Label Head (DirtySnatcha Records)
- Commission: 10% (agent booking) / 20% (direct booking)
- Label: DirtySnatcha Records (DSR) | Distributor: VMG
- Platform: TENx10

LABEL CATALOG:
- 154 releases (DSR002–DSR178), 220 tracks, 116 unique artists
- Date range: Oct 2019 – Feb 2026
- Genre: 98% Dubstep
- 2025 pace: 1 release every 10-11 days (34 releases)
- Distribution: 100% Virgin Music Group (VMG)

MANAGED ARTISTS (4):
1. DirtySnatcha (Leigh Bray) — headline artist. 136 tracks, 14M all-time streams, PS 28. Tour: 17 shows ~$38,600. Active release: "Drugs In Da Club" (Feb 27, 2026).
2. WHOiSEE (Brett, NC) — development. 28 tracks, 19K 28-day streams. Circus Records UK EP in progress. Hidden gems with 9-15% save ratios.
3. Dark Matter (Chicago/Knoxville) — development. Wakaan release. Support on DS tour.
4. Kotrax — development. 7 tracks on DSR catalog.

DSR LABEL (DirtySnatcha Records — separate from artist management):
- Thomas runs DSR as label head in addition to managing 4 artists
- 154 releases (DSR002–DSR178), 220 tracks, 116 roster artists
- Distributor: Virgin Music Group (VMG)
- Notable DSR artists: DirtySnatcha, Kotrax, OZZTIN, MAVIC, PRIYANX + 110 others

🔴 URGENT RIGHT NOW:
- Pittsburgh deposit $1,250 OVERDUE 18+ days — no promoter contact. Get from Colton immediately.
- Houston/Dallas artwork — Andrew Winters sent Drive link. Waiting for approval/billing decision.
- WHOiSEE Circus EP artwork — sidebar title format decision needed with Holly Grainger.
- Albuquerque March 6 — 3 days out, partial deposit only, no signed contract.
- DirtyT April 18 — 23 tickets sold, 227 remaining. Needs marketing push NOW.
- Adobe Sign: DirtySnatcha_Prysm_Mutual_Transition_and_Release — CONTRACT WAITING SIGNATURE.

🟡 THIS WEEK:
- Spokane counter offer ($3K) sent to Andrew Z — awaiting response
- Tampa venue TBD — 10 days out, at risk
- Butte May 2 — full advance needed
- WHOiSEE Magic Marquee — $200-250 campaign, DO NOT WAIT longer
- Drugs In Da Club — Day 5, launch Marquee before Day 10 window closes

VOICE: Elite manager. Direct, specific, blunt. Real dollar amounts, dates, names. 3 priorities not 20. Every recommendation has a CTA with who to contact and by when.`,
};
const DSR_LABEL = {
  id: "dsr_label",
  name: "DirtySnatcha Records",
  label: "Label Dashboard — VMG Distribution",
  color: "#dc2626",
  accent: "#f87171",
  emoji: "🏷️",
  tagline: "154 releases. 116 artists. 100% dubstep.",
  passcode: "DSR2026",
  profile: {
    genre: "Dubstep / Bass Music",
    location: "Auburn Hills, MI",
    active_release: "DSR178 — Drugs In Da Club",
  },
  systemPrompt: `You are an AI agent for DirtySnatcha Records (DSR), an independent dubstep label distributed through Virgin Music Group (VMG). Label head: Thomas Nalian (thomas@dirtysnatcha.com / 248-765-1997).

LABEL STATS:
- Catalog: DSR002–DSR178 · 154 releases · 220 tracks · 116 unique artists
- Founded: October 2019
- Distributor: Virgin Music Group (VMG)
- Genre: 98% Dubstep
- 2025 pace: 34 releases (1 every 10–11 days)
- Next release window: ~April 10, 2026 (6-week cadence from DSR178)

PRIORITY ROSTER:
- DirtySnatcha — headline. PS 28, 14.07M streams, 44K ML, 26.6K followers, active tour, DSR178 live
- WHOiSEE — development. Circus Records UK EP in progress (co-release)
- Kotrax — development. 7 DSR catalog tracks
- OZZTIN, MAVIC, PRIYANX — active DSR roster

RELEASE RULES:
- 6-week minimum between releases (Artist PS decay prevention)
- Upload VMG 3 weeks before drop · Editorial pitch 7+ days before drop
- Discovery Mode toggleable for all VMG-distributed tracks

DEMO INTAKE: demos@dirtysnatcharecords.com · 2-week review window
SOCIAL: @dirtysnatcharecords (IG/FB) · @dsrecords (X)

VOICE: Label authority. Bass culture. Short, direct, confident. "DirtySnatcha Records" is the brand. Spotlight artists. No corporate language.`,
};

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toString();
}

const CATALOG_DATA = {
  dirtysnatcha: {
    stats: [{l:"Total Streams",v:"14M",s:"all-time"},{l:"Catalog",v:"136",s:"tracks"},{l:"Top Track",v:"1.39M",s:"Breathin"},{l:"Save Ratio",v:"11.6%",s:"28-day avg"}],
    concentration: [{label:"Top 5 tracks",pct:15},{label:"Top 20 tracks",pct:35},{label:"Long tail",pct:65}],
    topTracks: [
      {song:"Breathin",streams:1390000,year:"2022",save:11.6},{song:"Dope",streams:1060000,year:"2019",save:8.2},
      {song:"Smoke",streams:980000,year:"2021",save:9.1},{song:"Stay",streams:920000,year:"2020",save:7.8},
      {song:"Drugs In Da Club",streams:85000,year:"2026",save:14.2},
    ],
    hiddenGems: [{song:"Get Strange",save:21.3,note:"PS seed"},{song:"Rollin",save:18.1,note:"DW candidate"}],
    eras: {"2013–18":24,"2019–21":38,"2022–23":31,"2024–26":43},
  },
  whoisee: {
    stats: [{l:"28-day Streams",v:"19K",s:"active"},{l:"Catalog",v:"28",s:"tracks"},{l:"Best Save",v:"15.8%",s:"Make U Do"},{l:"Marquee",v:"29.9%",s:"Provision best"}],
    topTracks: [
      {song:"Magic",streams:12116,year:"2025",save:3.7},{song:"Make U Do",streams:4200,year:"2024",save:15.8},
      {song:"Hip Swing",streams:8900,year:"2024",save:9.2},{song:"Tunnel Vision",streams:6800,year:"2024",save:11.4},
      {song:"Get Down",streams:4500,year:"2026",save:6.1},
    ],
    hiddenGems: [{song:"Make U Do",save:15.8,note:"Stealth PS spike"},{song:"Tunnel Vision",save:11.4,note:"DW candidate"}],
    eras: {"2022":8,"2023":10,"2024":7,"2025–26":3},
  },
  manager: {
    stats: [{l:"Releases",v:"154",s:"DSR002–178"},{l:"Tracks",v:"220",s:"total"},{l:"Artists",v:"116",s:"unique"},{l:"2025 pace",v:"34",s:"releases"}],
    genres: [{name:"Dubstep",count:151,pct:98},{name:"D&B",count:1,pct:1},{name:"Garage",count:1,pct:1},{name:"Trap",count:1,pct:1}],
    topArtists: ["DirtySnatcha (136 tracks)","WHOiSEE (28 tracks)","OZZTIN","MAVIC","PRIYANX","Kotrax (7 tracks)"],
  },
  dsr_label: {
    stats: [{l:"Releases",v:"154",s:"DSR002–178"},{l:"Tracks",v:"220",s:"VMG"},{l:"Artists",v:"116",s:"unique"},{l:"2025 pace",v:"34",s:"releases"}],
    yearPace: [{y:"2019",n:8},{y:"2020",n:18},{y:"2021",n:22},{y:"2022",n:28},{y:"2023",n:31},{y:"2024",n:35},{y:"2025",n:34},{y:"2026",n:3}],
    roster: [{name:"DirtySnatcha",ps:28,tracks:136,status:"HEADLINE"},{name:"WHOiSEE",ps:"15-25",tracks:28,status:"ACTIVE"},{name:"Kotrax",ps:"—",tracks:7,status:"ACTIVE"},{name:"OZZTIN",ps:"—",tracks:"—",status:"ACTIVE"},{name:"MAVIC",ps:"—",tracks:"—",status:"ACTIVE"},{name:"PRIYANX",ps:"—",tracks:"—",status:"ACTIVE"}],
    dmTracks: [{t:"Drugs In Da Club (DSR178)",a:"DirtySnatcha",s:"TOGGLE NOW"},{t:"Hip Swing (DSR159)",a:"WHOiSEE",s:"TOGGLE NOW"},{t:"Tunnel Vision (DSR166)",a:"WHOiSEE",s:"TOGGLE NOW"},{t:"Magic",a:"WHOiSEE",s:"BLOCKED — Label Radar"},{t:"Get Down",a:"WHOiSEE",s:"BLOCKED — Kannibalen"}],
  },
};

function StatBar({ stats, color }) {
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map(s => (
        <div key={s.l} className="rounded-lg p-2 text-center" style={{background:`${color}09`}}>
          <div className="text-lg font-black" style={{color}}>{s.v}</div>
          <div className="text-xs font-semibold text-white">{s.l}</div>
          <div className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{s.s}</div>
        </div>
      ))}
    </div>
  );
}

function TrackRow({ t, color, max }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="font-medium text-white">{t.song} <span style={{color:"rgba(255,255,255,0.3)",fontWeight:400}}>({t.year})</span></span>
        <span style={{color}}>{t.save}% save</span>
      </div>
      <div className="h-1.5 rounded-full" style={{background:"rgba(255,255,255,0.06)"}}>
        <div className="h-full rounded-full" style={{width:`${(t.streams/max)*100}%`,background:`linear-gradient(90deg,${color},${color}88)`}} />
      </div>
    </div>
  );
}

function CatalogView({ entity }) {
  const color = entity.color;
  const id = entity.id;
  const d = CATALOG_DATA[id];
  if (!d) return <div className="p-6 text-center text-sm" style={{color:"rgba(255,255,255,0.4)"}}>No catalog data yet.</div>;

  if (id === "dirtysnatcha" || id === "whoisee") {
    const maxStreams = d.topTracks[0].streams;
    return (
      <div className="p-4 space-y-4">
        <StatBar stats={d.stats} color={color} />
        <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <div className="text-xs font-bold mb-3 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>Top Tracks</div>
          {d.topTracks.map(t => <TrackRow key={t.song} t={t} color={color} max={maxStreams} />)}
        </div>
        {d.hiddenGems && (
          <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>{'💎 Hidden Gems'}</div>
            {d.hiddenGems.map(g => (
              <div key={g.song} className="flex justify-between text-xs mb-1">
                <span className="text-white">{g.song}</span>
                <div className="flex gap-2">
                  <span style={{color}}>{g.save}% save</span>
                  <span style={{color:"rgba(255,255,255,0.3)"}}>{g.note}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {d.eras && (
          <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>Era Distribution</div>
            {Object.entries(d.eras).map(([era, count]) => (
              <div key={era} className="flex justify-between text-xs mb-1">
                <span style={{color:"rgba(255,255,255,0.5)"}}>{era}</span>
                <span style={{color}}>{count} tracks</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (id === "manager" || id === "dsr_label") {
    const isLabel = id === "dsr_label";
    return (
      <div className="p-4 space-y-4">
        <StatBar stats={d.stats} color={color} />
        {d.yearPace && (
          <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>Release Pace</div>
            <div className="flex items-end gap-1" style={{height:48}}>
              {d.yearPace.map(y => (
                <div key={y.y} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full rounded-sm" style={{background:color,height:`${(y.n/35)*40}px`,opacity:y.y==="2026"?0.4:0.8}} />
                  <span style={{color:"rgba(255,255,255,0.3)",fontSize:9}}>{y.y.slice(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {d.roster && (
          <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>Priority Roster</div>
            {d.roster.map(r => (
              <div key={r.name} className="flex items-center justify-between mb-1.5 p-2 rounded-lg" style={{background:"rgba(255,255,255,0.025)"}}>
                <div>
                  <span className="text-xs font-semibold text-white">{r.name}</span>
                  <span className="text-xs ml-2" style={{color:"rgba(255,255,255,0.3)"}}>{r.tracks} tracks</span>
                </div>
                <div className="flex gap-2">
                  {r.ps !== "—" && <span className="text-xs font-bold" style={{color}}>PS {r.ps}</span>}
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:`${color}18`,color,fontSize:10}}>{r.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        {d.genres && (
          <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>Genre Mix</div>
            {d.genres.map(g => (
              <div key={g.name} className="mb-2">
                <div className="flex justify-between text-xs mb-0.5">
                  <span style={{color:"rgba(255,255,255,0.6)"}}>{g.name}</span>
                  <span style={{color}}>{g.count}</span>
                </div>
                <div className="h-1 rounded-full" style={{background:"rgba(255,255,255,0.06)"}}>
                  <div className="h-full rounded-full" style={{width:`${g.pct}%`,background:color}} />
                </div>
              </div>
            ))}
          </div>
        )}
        {d.dmTracks && (
          <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>Discovery Mode</div>
            {d.dmTracks.map(t => (
              <div key={t.t} className="flex items-center justify-between mb-1.5">
                <div className="text-xs"><span className="text-white">{t.t}</span><span className="ml-1" style={{color:"rgba(255,255,255,0.35)"}}>· {t.a}</span></div>
                <span className="text-xs font-bold" style={{color: t.s.includes("TOGGLE") ? "#00ff88" :"#facc15"}}>{t.s}</span>
              </div>
            ))}
          </div>
        )}
        {d.topArtists && (
          <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>Top Artists</div>
            {d.topArtists.map(a => (
              <div key={a} className="text-xs mb-1" style={{color:"rgba(255,255,255,0.6)"}}>• {a}</div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return <div className="p-6 text-center text-sm" style={{color:"rgba(255,255,255,0.4)"}}>No catalog data.</div>;
}

function OverviewView({ entity }) {
  const color = entity.color;
  const profile = entity.profile || {};

  if (entity.id === "dsr_label") {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.25)"}}>
          <div className="text-xs font-bold mb-3 uppercase tracking-widest" style={{color:"#dc2626"}}>{"🏷️"} DirtySnatcha Records</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {[{v:"154",l:"Releases",s:"DSR002→178"},{v:"220",l:"Tracks",s:"all VMG"},{v:"116",l:"Artists",s:"on catalog"},{v:"98%",l:"Genre",s:"Dubstep"}].map(s=>(
              <div key={s.l} className="rounded-lg p-2 text-center" style={{background:"rgba(220,38,38,0.07)"}}>
                <div className="text-lg font-black" style={{color:"#dc2626"}}>{s.v}</div>
                <div className="text-xs font-semibold text-white">{s.l}</div>
                <div className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{s.s}</div>
              </div>
            ))}
          </div>
          {["DSR179 next release — upload VMG by Mar 10 for Apr 10 drop. Editorial pitch Mar 27.","WHOiSEE / Circus Records UK — artwork decision with Holly Grainger NEEDED NOW.","Discovery Mode → DSR178 live. Toggle ON in VMG portal today.","Demo inbox — demos@dirtysnatcharecords.com — check pending submissions."].map((item,i)=>(
            <div key={i} className="flex gap-2 mb-1">
              <span style={{color:"#ef4444"}}>•</span>
              <span className="text-xs" style={{color:"rgba(255,255,255,0.65)"}}>{item}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>{"📱"} Label Socials</div>
          {[{p:"Instagram",h:"@dirtysnatcharecords"},{p:"X/Twitter",h:"@dsrecords"},{p:"Facebook",h:"DirtySnatcha Records"},{p:"Demo Email",h:"demos@dirtysnatcharecords.com"}].map(s=>(
            <div key={s.p} className="flex justify-between text-xs mb-1">
              <span style={{color:"rgba(255,255,255,0.45)"}}>{s.p}</span>
              <span style={{color:"#dc2626"}}>{s.h}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entity.id === "manager") {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{ background:"rgba(245,158,11,0.08)", border:"1px solid rgba(245,158,11,0.25)" }}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color:"#f59e0b" }}>{'⚡ Manager — Thomas Nalian'}</div>
          {["Pittsburgh deposit $1,250 OVERDUE — collect from Colton TODAY.","DirtySnatcha Adobe Sign contract waiting — send now.","DirtyT Apr 18 — 23 sold/250 cap. Push marketing immediately.","WHOiSEE Magic Marquee — $200-250 budget. Launch before Day 10.","WHOiSEE Circus EP artwork — decision with Holly Grainger needed."].map((a,i)=>(
            <div key={i} className="flex gap-2 mb-1"><span style={{ color:"#ef4444" }}>•</span><span className="text-xs" style={{ color:"rgba(255,255,255,0.7)" }}>{a}</span></div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.4)" }}>{'📊 Tour P&amp;L Snapshot'}</div>
          {[{l:"Total Guaranteed",v:"$38,600",c:"#00ff88"},{l:"Total Expenses",v:"~$12,400",c:"#ef4444"},{l:"Net Projected",v:"~$26,200",c:"#00ff88"},{l:"Shows Confirmed",v:"12 / 17",c:"#f59e0b"},{l:"Shows At Risk",v:"3",c:"#ef4444"}].map(s=>(
            <div key={s.l} className="flex justify-between text-xs mb-1"><span style={{ color:"rgba(255,255,255,0.45)" }}>{s.l}</span><span className="font-bold" style={{ color:s.c }}>{s.v}</span></div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)" }}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{ color:"rgba(255,255,255,0.4)" }}>{'🎤 Roster'}</div>
          {[{n:"DirtySnatcha",s:"17-show tour active · DITC live",c:"#00ff88"},{n:"WHOiSEE",s:"Circus Records UK EP in progress",c:"#a855f7"},{n:"Dark Matter",s:"Wakaan release · DS Tour support",c:"#06b6d4"},{n:"Kotrax",s:"DSR development · 7 catalog tracks",c:"#f97316"}].map(r=>(
            <div key={r.n} className="flex items-center gap-2 mb-1.5 p-1.5 rounded-lg" style={{ background:"rgba(255,255,255,0.025)" }}>
              <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ background:r.c }} />
              <div><div className="text-xs font-semibold text-white">{r.n}</div><div className="text-xs" style={{ color:"rgba(255,255,255,0.35)" }}>{r.s}</div></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entity.id === "dirtysnatcha") {
    const shows = [
      {city:"Albuquerque",date:"Mar 6",venue:"Effex",status:"CONFIRMED"},{city:"Tampa",date:"Mar 13",venue:"TBD",status:"AT RISK"},
      {city:"Pittsburgh",date:"Mar 14",venue:"SideQuest",status:"CONFIRMED"},{city:"Lincoln",date:"Mar 20",venue:"Bourbon Theatre",status:"CONFIRMED"},
      {city:"DirtyT",date:"Apr 18",venue:"Rialto Tucson",status:"23 SOLD"},
    ];
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)"}}>
          <div className="text-xs font-bold mb-3 uppercase tracking-widest" style={{color}}>{'🔴 Urgent'}</div>
          {["Pittsburgh deposit $1,250 — OVERDUE 18+ days. Get from Colton TODAY.","DITC Day 5 — launch Marquee NOW before Day 10 window closes.","Adobe Sign: DirtySnatcha_Prysm_Mutual_Transition — CONTRACT WAITING.","DirtyT Apr 18 — 23 tickets sold, 227 left. Marketing push needed NOW."].map((item,i)=>(
            <div key={i} className="flex gap-2 mb-1"><span style={{color:"#ef4444"}}>•</span><span className="text-xs" style={{color:"rgba(255,255,255,0.7)"}}>{item}</span></div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>{'📊 Artist Stats'}</div>
          {[{l:"Monthly Listeners",v:"44K"},{l:"Spotify Followers",v:"26,648"},{l:"Popularity Score",v:"28"},{l:"Instagram",v:"11K"},{l:"All-time Streams",v:"14M"},{l:"Active Release",v:"Drugs In Da Club"}].map(s=>(
            <div key={s.l} className="flex justify-between text-xs mb-1"><span style={{color:"rgba(255,255,255,0.45)"}}>{s.l}</span><span className="font-semibold" style={{color}}>{s.v}</span></div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>{'🎤 Tour — Next 5 Shows'}</div>
          {shows.map(s=>(
            <div key={s.city} className="flex items-center justify-between mb-1.5 p-1.5 rounded-lg" style={{background:"rgba(255,255,255,0.025)"}}>
              <div><span className="text-xs font-semibold text-white">{s.city}</span><span className="text-xs ml-1.5" style={{color:"rgba(255,255,255,0.35)"}}>{s.date} · {s.venue}</span></div>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded-full" style={{background:s.status==="AT RISK"?"rgba(239,68,68,0.15)":s.status.includes("SOLD")?"rgba(250,204,21,0.12)":"rgba(0,255,136,0.1)",color:s.status==="AT RISK"?"#ef4444":s.status.includes("SOLD")?"#facc15":"#00ff88"}}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (entity.id === "whoisee") {
    return (
      <div className="p-4 space-y-4">
        <div className="rounded-xl p-4" style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)"}}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color}}>{'🔴 Urgent'}</div>
          {["Magic — launch Marquee $200-250. Track PS needs boost. DO NOT WAIT.","Circus Records UK EP — artwork sidebar title format. Decision needed with Holly Grainger.","Discovery Mode: Hip Swing + Tunnel Vision — toggle ON in VMG portal.","Get Down (Kannibalen) — request Discovery Mode permission from label."].map((item,i)=>(
            <div key={i} className="flex gap-2 mb-1"><span style={{color:"#ef4444"}}>•</span><span className="text-xs" style={{color:"rgba(255,255,255,0.7)"}}>{item}</span></div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>{'📊 Stats'}</div>
          {[{l:"28-day Streams",v:"19K"},{l:"Best Save Ratio",v:"15.8% (Make U Do)"},{l:"Top Track",v:"Magic — 12,116 streams"},{l:"Marquee Best",v:"29.9% (Provision)"},{l:"Label",v:"DSR + Circus Records UK"},{l:"Status",v:"Circus EP in progress"}].map(s=>(
            <div key={s.l} className="flex justify-between text-xs mb-1"><span style={{color:"rgba(255,255,255,0.45)"}}>{s.l}</span><span className="font-semibold" style={{color}}>{s.v}</span></div>
          ))}
        </div>
        <div className="rounded-xl p-4" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.07)"}}>
          <div className="text-xs font-bold mb-2 uppercase tracking-widest" style={{color:"rgba(255,255,255,0.4)"}}>{'🎤 Shows'}</div>
          {[{c:"Pittsburgh",d:"Mar 14",v:"SideQuest",r:"Support — DS Tour"},{c:"Asbury Park",d:"Apr 24",v:"House of Independents",r:"Support — DS Tour"}].map(s=>(
            <div key={s.c} className="flex items-center justify-between mb-1.5 p-1.5 rounded-lg" style={{background:"rgba(255,255,255,0.025)"}}>
              <div><span className="text-xs font-semibold text-white">{s.c}</span><span className="text-xs ml-1.5" style={{color:"rgba(255,255,255,0.35)"}}>{s.d} · {s.v}</span></div>
              <span className="text-xs" style={{color}}>{s.r}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(profile).slice(0, 6).map(([k, v]) => (
          <div key={k} className="rounded-xl p-3"
            style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
            <div className="text-xs capitalize mb-1" style={{color:"rgba(255,255,255,0.4)"}}>
              {k.replace(/_/g, " ")}
            </div>
            <div className="text-xs font-semibold text-white leading-relaxed">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Message({ msg, color }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0"
          style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}>
          ⚡
        </div>
      )}
      <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap`}
        style={isUser ? {
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.18)",
          color: "#fff",
          borderRadius: "18px 18px 4px 18px"
        } : {
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          color: "rgba(255,255,255,0.88)",
          borderRadius: "18px 18px 18px 4px"}}>
        {msg.content}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0"
        style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)"}}>
        ⚡
      </div>
      <div className="px-4 py-3 rounded-2xl" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"18px 18px 18px 4px"}}>
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{background:"rgba(255,255,255,0.35)",animationDelay:`${i * 0.15}s`}} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DUAL AI ROUTER
// Artifact / claude.ai  → Claude API (builder layer)
// Production deployment → Gemini API (consumer layer)
// Auto-detects by hostname. Both use same interface.
// ─────────────────────────────────────────────────────────
const AI_PROVIDER = typeof window !== "undefined" &&
  window.location?.hostname?.includes("claude.ai")
    ? "claude"
    : "gemini";

const GEMINI_KEY = (typeof window !== "undefined" && window.__env?.VITE_GEMINI_API_KEY) || "";

async function callAI(systemPrompt, messages) {
  if (AI_PROVIDER === "claude") {
    // ── Claude API (artifact / builder layer) ──────────────
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || "No response.";
  } else {
    // ── Gemini API (production consumer layer) ─────────────
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }],
          })),
          generationConfig: { maxOutputTokens: 1000, temperature: 0.7 },
        }),
      }
    );
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "No response.";
  }
}


function ChatTab({ entity }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const color = entity.color;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { if (!initialized) { setInitialized(true); sendGreeting(); } }, []);

  const sendGreeting = async () => {
    setLoading(true);
    try {
      const text = await callAI(
        entity.systemPrompt,
        [{ role: "user", content: "Give me a quick status briefing — what matters most right now?" }]
      );
      setMessages([{ role: "assistant", content: text }]);
    } catch (err) {
      setMessages([{ role: "assistant", content: `⚠️ Briefing failed: ${err?.message || "Unknown error"}. Type your question below.` }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const sendMessage = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;
    setInput("");
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const reply = await callAI(
        entity.systemPrompt,
        newMessages.map(m => ({ role: m.role, content: m.content }))
      );
      setMessages([...newMessages, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: "assistant", content: `⚠️ Error: ${err?.message || "Connection failed. Check console."}` }]);
    }
    setLoading(false);
  };

  const send = () => sendMessage();

  const quickPrompts = entity.id === "manager"
    ? ["Daily briefing", "What's overdue?", "Tour P&L", "Pittsburgh deposit"]
    : entity.id === "dirtysnatcha"
    ? ["What's urgent today?", "Marquee strategy", "DirtyT ticket count", "Content ideas"]
    : entity.id === "whoisee"
    ? ["Magic Marquee plan", "Circus Records status", "Discovery Mode options", "Release timing"]
    : entity.id === "kotrax"
    ? ["Release strategy", "DSP overview", "What should I focus on?", "Content ideas"]
    : ["Wakaan strategy", "Pittsburgh advance", "Content ideas", "What's urgent?"];

  return (
    <div className="flex flex-col" style={{height:"calc(100vh - 140px)"}}>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m, i) => <Message key={i} msg={m} color={color} />)}
        {loading && <TypingIndicator />}
        {!loading && messages.length === 0 && (
          <div className="text-center mt-8">
            <div className="text-sm mb-3" style={{color:"rgba(255,255,255,0.3)"}}>Tap a quick action or type below</div>
            <button onClick={sendGreeting}
              className="text-xs px-4 py-2 rounded-full"
              style={{background:`${color}20`,border:`1px solid ${color}40`,color}}>
              Get Briefing
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      {messages.length <= 1 && !loading && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {quickPrompts.map((p, i) => (
            <button key={i} onClick={() => sendMessage(p)}
              className="text-xs px-3 py-1.5 rounded-full transition-all hover:opacity-80"
              style={{background:`${color}15`,border:`1px solid ${color}30`,color}}>
              {p}
            </button>
          ))}
        </div>
      )}
      <div className="px-4 pb-4 pt-2">
        <div className="flex gap-2 items-end rounded-2xl p-1" style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${loading ? color + "44" :"rgba(255,255,255,0.1)"}`,transition:"border-color 0.2s"}}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything..."
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm px-3 py-2"
            style={{color:"rgba(255,255,255,0.9)",caretColor: color,maxHeight:"120px"}}
          />
          <button onClick={send} disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl flex items-center justify-center mb-1 mr-1 transition-all"
            style={{background: input.trim() && !loading ? color :"rgba(255,255,255,0.08)",color: input.trim() && !loading ? "#000" :"rgba(255,255,255,0.25)"}}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}

const TZ_COLORS = { ET:"#60a5fa", CT:"#a78bfa", MT:"#34d399", PT:"#fb923c" };


const CONTENT_CALENDAR = {
  dirtysnatcha: [
    ["ds001","2026-03-04","6PM","IG/FB","tour","ALBUQUERQUE 🛸🔥  went absolutely crazy. you guys showed UP. we pulling back up someday soon","tag","H","ET"],
    ["ds002","2026-03-04","2PM","Story","tour","ABQ RECAP — 3-slide story: best crowd shot → laser photo → setlist shot","tag","M","ET"],
    ["ds003","2026-03-05","7PM","IG Reels / TikTok","tour","ABQ energy clip — no caption needed, let the footage talk 🛸","follow","H","ET"],
    ["ds004","2026-03-05","12PM","X / Twitter","release","Drugs In Da Club — day 7. go run it up 🛸 search my name on Spotify","search","M","ET"],
    ["ds005","2026-03-06","10AM","Story","release","WHAT TRACK IS THIS 🛸 [15s DITC clip — no title shown, force the Shazam] [Add Shazam link sticker]","stream","H","ET"],
    ["ds006","2026-03-06","9PM","TikTok","release","saving Drugs In Da Club tells the algorithm you fw it 🛸 go save it","save","H","ET"],
    ["ds007","2026-03-07","6PM","IG/FB","release","Drugs In Da Club 🛸  this one hit different. week 1 in and still running. search my name on Spotify and save...","search+save","H","ET"],
    ["ds008","2026-03-08","6PM","IG Reels / TikTok","branding","studio mode 🛸 always cooking","follow","M","ET"],
    ["ds009","2026-03-09","12PM","ALL","tour","FLORIDA 🛸🌴  DirtySnatcha · Take Me To Your Leader Tour March 13 @ Tampa w/ Kotrax · Mport · HVRCRFT  Spring...","tickets","H","ET"],
    ["ds010","2026-03-09","4PM","ALL","tour","PITTSBURGH THIS SATURDAY 🛸🔥  SideQuest · March 14 w/ WHOiSEE · Dark Matter  PGH is ready for this  tickets ...","tickets","H","ET"],
    ["ds011","2026-03-11","7PM","IG Reels / TikTok","tour","Spring Break but make it dubstep 🌴👽🔥  Tampa · March 13 DirtySnatcha + Kotrax + Mport + HVRCRFT  this is not...","tickets","H","ET"],
    ["ds012","2026-03-11","10AM","Story","tour","PITTSBURGH SATURDAY 🛸 WHOiSEE + Dark Matter on the bill. PGH is not ready [Tag @whoiseemusic @darkmattermusic]","tickets","H","ET"],
    ["ds013","2026-03-12","12PM","X / Twitter","tour","FL TOMORROW. PGH SATURDAY. the aliens don't stop 🛸","tickets","H","ET"],
    ["ds014","2026-03-12","9PM","Story / TikTok","tour","TAMPA TOMORROW 🛸🌴 PITTSBURGH SATURDAY 🔥 [Countdown sticker to Tampa show]","tickets","H","ET"],
    ["ds015","2026-03-13","2PM","Story","tour","GAME DAY 🛸🌴 Tampa pulling up — travel BTS, soundcheck, venue walk","tag","H","ET"],
    ["ds016","2026-03-13","9PM","Story","tour","TONIGHT. TAMPA. 🛸 [Add ticket link sticker if any still available]","tickets","H","ET"],
    ["ds017","2026-03-14","2PM","IG Reels / TikTok / YouTube","tour","TAMPA 🛸🌴 Spring Break dubstep invasion. we don't miss","follow","H","ET"],
    ["ds018","2026-03-14","7PM","Story","tour","PITTSBURGH TONIGHT 🛸🔥 SideQuest. game day — soundcheck BTS","tickets","H","ET"],
    ["ds015b","2026-03-15","12PM","IG/FB","tour","TAMPA + PITTSBURGH WENT OFF 🔥🔥  two shows. two cities. zero chill. thank you FL and PGH — we see you 🛸🙏","tag","H","ET"],
    ["ds019","2026-03-16","7PM","IG Reels / TikTok","branding","always cooking 🛸 tour mode but the studio doesn't stop","follow","M","ET"],
    ["ds020","2026-03-17","10AM","Story","release","Drugs In Da Club update 🛸 [share milestone — streams + saves] search my name on Spotify to help the count [...","search+save","M","ET"],
    ["ds021","2026-03-18","9PM","TikTok","branding","dubstep aliens don't take days off 👽🛸","follow","M","ET"],
    ["ds022","2026-03-19","6PM","ALL","tour","NEBRASKA 🛸  Lincoln this Saturday. Sidebar.  pulling up with the heavy stuff. don't sleep  tickets in bio","tickets","H","ET"],
    ["ds023","2026-03-20","6PM","IG Reels / TikTok","branding","tour highlights so far 🛸🔥 ABQ → Tampa → Pittsburgh","follow","M","ET"],
    ["ds024","2026-03-21","2PM","Story","tour","LINCOLN TONIGHT 🛸 Sidebar. game day setup","tickets","H","ET"],
    ["ds025","2026-03-21","9PM","Story","tour","TONIGHT. LINCOLN. SIDEBAR. 🛸 [Ticket link sticker]","tickets","H","ET"],
    ["ds026","2026-03-22","12PM","IG/FB","tour","LINCOLN 🛸🙏 Nebraska always shows up. thank you Sidebar","tag","H","ET"],
    ["ds027","2026-03-23","6PM","IG/FB","tour","OKLAHOMA 🛸🔥  OKC Friday. Tulsa Saturday. the aliens hit the midwest back to back  tickets in bio","tickets","H","ET"],
    ["ds028","2026-03-24","7PM","TikTok / IG Reels","tour","pulling up to Oklahoma this week with the dubstep invasion 🛸👽 OKC Friday · Tulsa Saturday","tickets","H","ET"],
    ["ds029","2026-03-25","10AM","Story","release","tell Alexa to play Drugs In Da Club 🛸 [branded Alexa CTA graphic]","stream","M","ET"],
    ["ds030","2026-03-26","9PM","Story / TikTok","tour","OKC TOMORROW 🛸 TULSA SATURDAY 🔥 back to back. Oklahoma is not ready [Countdown sticker to Friday show]","tickets","H","ET"],
    ["ds031","2026-03-27","2PM","Story","tour","GAME DAY. OKC 🛸 pulling up","tag","H","ET"],
    ["ds032","2026-03-27","9PM","Story","tour","TONIGHT. OKC. 🛸🔥","tickets","H","ET"],
    ["ds033","2026-03-28","2PM","IG Reels / TikTok","tour","OKC last night 🛸🔥 now pulling up to Tulsa — no days off","follow","H","ET"],
    ["ds034","2026-03-29","12PM","IG/FB","tour","OKC + TULSA 🛸🔥🔥 Oklahoma ate this weekend. both nights went crazy. thank you","tag","H","ET"],
    ["ds035","2026-03-31","7PM","IG Reels / TikTok","branding","on the road. always. 🛸  behind the scenes of Take Me To Your Leader 2026","follow","M","ET"],
    ["ds036","2026-04-02","6PM","ALL","tour","DENVER 🛸🏔️ this Saturday. Colorado we're pulling up  tickets in bio","tickets","H","ET"],
    ["ds037","2026-04-04","2PM","Story","tour","DENVER TONIGHT 🛸🏔️ game day","tickets","H","ET"],
    ["ds038","2026-04-05","12PM","IG/FB","tour","DENVER 🛸🙏 Colorado always goes crazy. thank you","tag","H","ET"],
    ["ds039","2026-04-07","6PM","IG/FB","tour","KANSAS CITY 🛸🔥 next Friday. MO we're coming  tickets in bio","tickets","H","ET"],
    ["ds040","2026-04-09","9AM","Story","tour","TUCSON APRIL 18 🛸 DirtyT. if you're in Arizona — link in bio. 227 tickets left. don't sleep","tickets","H","ET"],
    ["ds041","2026-04-10","2PM","Story","tour","KANSAS CITY TONIGHT 🛸🔥","tickets","H","ET"],
    ["ds042","2026-04-11","12PM","IG/FB","tour","KC 🛸 went off. thank you Kansas City 🔥","tag","H","ET"],
    ["ds043","2026-04-14","6PM","ALL","tour","TUCSON THIS SATURDAY 🛸🌵  Rialto Theatre · April 18 DirtyT fest vibes. this show is special  tickets in bio ...","tickets","H","ET"],
    ["ds044","2026-04-16","9PM","TikTok / IG Reels","tour","TUCSON SATURDAY 🛸🌵 Rialto Theatre. Arizona come through — this lineup goes HARD","tickets","H","ET"],
    ["ds045","2026-04-18","2PM","Story","tour","TONIGHT. TUCSON. RIALTO. 🛸🌵 DirtyT. game day","tickets","H","ET"],
    ["ds046","2026-04-19","12PM","IG/FB","tour","TUCSON 🛸🌵🔥 Rialto Theatre went absolutely crazy. Arizona — you showed UP","tag","H","ET"],
    ["ds047","2026-04-21","6PM","ALL","tour","EAST COAST 🛸🔥  Asbury Park Friday · Hartford Saturday  House of Independents + CT stop — the northeast run ...","tickets","H","ET"],
    ["ds048","2026-04-24","2PM","Story","tour","ASBURY PARK TONIGHT 🛸 House of Independents. NJ let's go","tickets","H","ET"],
    ["ds049","2026-04-25","2PM","Story","tour","HARTFORD TONIGHT 🛸 CT we're pulling up","tickets","H","ET"],
    ["ds050","2026-04-26","12PM","IG/FB","tour","NJ + CT 🛸🔥 two more nights in the books. East Coast always shows love. thank you 🙏","tag","H","ET"],
    ["ds051","2026-04-28","6PM","ALL","tour","BUTTE, MONTANA 🛸🏔️  May 2 · Covellite Theatre MAD Series  tour finale. this one's going to be something spe...","tickets","H","ET"],
    ["ds052","2026-04-30","9PM","TikTok / IG Reels","tour","tour finale in 2 days 🛸🏔️ Butte Montana · Covellite Theatre · MAD Series  if you're anywhere near Montana —...","tickets","H","ET"],
    ["ds053","2026-05-02","2PM","Story","tour","TOUR FINALE. BUTTE. TONIGHT 🛸🏔️ Covellite Theatre. game day","tickets","H","ET"],
    ["ds054","2026-05-03","12PM","ALL","tour","Take Me To Your Leader 2026 🛸🙏  17 cities. 17 nights. we went everywhere.  thank you to everyone who came o...","follow","H","ET"],
  ],
  whoisee: [
    ["ws001","2026-03-04","7PM","IG+TT","release","magic 👁️  idk how this keeps finding new people but i'm not mad about it","search+save","H","ET"],
    ["ws002","2026-03-05","10AM","Story","release","if you've heard Magic — save it AND search WHOiSEE on Spotify. it tells the algorithm you fw it 👁️ [Spotify...","search+save","H","ET"],
    ["ws003","2026-03-07","6PM","IG","branding","if you know you know 👁️","follow","M","ET"],
    ["ws004","2026-03-09","6PM","IG/FB","tour","PITTSBURGH 🛸 Saturday March 14 · SideQuest  supporting @dirtysnatcha on the Take Me To Your Leader tour  th...","tickets","H","ET"],
    ["ws005","2026-03-11","7PM","TikTok / IG Reels","branding","been sitting on some new stuff 👁️ it's ready","follow","M","ET"],
    ["ws006","2026-03-13","7PM","Story","tour","Pittsburgh tomorrow 👁️🛸 @dirtysnatcha Take Me To Your Leader · SideQuest · support sets go hard","tickets","H","ET"],
    ["ws007","2026-03-14","2PM","Story","tour","PITTSBURGH TONIGHT 👁️🔥 SideQuest. first time in PGH. let's get it","tickets","H","ET"],
    ["ws008","2026-03-15","6PM","IG/FB","tour","Pittsburgh 🙏 first time in PGH and y'all did not disappoint. thank you SideQuest","follow","H","ET"],
    ["ws009","2026-03-17","7PM","TikTok / IG Reels","release","Make U Do 👁️  one of my favorites I've put out. if you slept on this one go listen","search+save","H","ET"],
    ["ws010","2026-03-18","10AM","Story","release","CRITICAL 👁️ — go listen. 11% of people who hear it save it. that's not nothing [Spotify link sticker]","save","H","ET"],
    ["ws011","2026-03-20","6PM","IG","branding","always working 👁️","follow","M","ET"],
    ["ws012","2026-03-24","7PM","TikTok / IG Reels","release","This Is It 👁️  some tracks just hit different at 2am","save","M","ET"],
    ["ws013","2026-03-26","9PM","Story","release","Magic is about to have new company 👁️ something coming soon [teaser]","follow","H","ET"],
    ["ws014","2026-03-28","6PM","IG/FB","branding","👁️  (something is coming)","follow","H","ET"],
    ["ws015","2026-04-01","7PM","TikTok / IG Reels","release","Hip Swing 👁️  if you haven't heard this one yet — listen once. you'll know","save","H","ET"],
    ["ws016","2026-04-04","6PM","IG","branding","NC built different 👁️","follow","M","ET"],
    ["ws017","2026-04-07","9PM","Story","release","Circus EP 👁️ 🎪 coming soon [teaser — Circus Records UK logo]","follow","H","ET"],
    ["ws018","2026-04-09","7PM","TikTok / IG Reels","release","Tunnel Vision 👁️  been running this one back since I finished it. it's different","save","H","ET"],
    ["ws019","2026-04-14","6PM","IG/FB","release","Circus EP 👁️🎪  something big coming with @circusrecords  if you know Circus you know what this means","follow","H","ET"],
    ["ws020","2026-04-18","6PM","ALL","release","EP artwork 👁️ [drop artwork reveal]","pre-save","H","ET"],
    ["ws021","2026-04-21","7PM","TikTok / IG Reels","release","EP dropping soon 👁️🎪 here's a taste","pre-save","H","ET"],
    ["ws022","2026-04-25","6PM","ALL","release","pre-save is live 👁️  Circus EP. dates soon.  link in bio","pre-save","H","ET"],
    ["ws023","2026-04-28","9PM","Story","release","EP drops in 7 days 👁️🎪 [Countdown sticker · pre-save link sticker]","pre-save","H","ET"],
  ],
  darkmatter: [
    ["dm001","2026-03-05","7PM","IG+TT","branding","heavy. 🌌","follow","M","CT"],
    ["dm002","2026-03-09","6PM","IG/FB","tour","Pittsburgh 🛸⚫ March 14 · SideQuest  supporting @dirtysnatcha on the Take Me To Your Leader tour  Dark Matte...","tickets","H","CT"],
    ["dm003","2026-03-13","9PM","Story","tour","Pittsburgh tomorrow 🌌 SideQuest · supporting @dirtysnatcha","tickets","H","CT"],
    ["dm004","2026-03-14","8PM","Story","tour","TONIGHT. SideQuest. Pittsburgh. 🌌","tag","H","CT"],
    ["dm005","2026-03-15","2PM","IG","tour","Pittsburgh 🌌 first time here. won't be the last. thank you SideQuest","follow","H","CT"],
    ["dm006","2026-03-19","7PM","TikTok / IG Reels","release","Wakaan 🌌 heavy  if you know Liquid Stranger's label you know the standard we hold ourselves to","save","H","CT"],
    ["dm007","2026-03-24","6PM","IG","branding","always in the studio 🌌⚫  new music coming","follow","M","CT"],
    ["dm008","2026-04-01","7PM","TikTok / IG Reels","release","this is what we do 🌌","save","H","CT"],
    ["dm009","2026-04-07","6PM","IG/FB","branding","Chicago. Knoxville. everywhere. 🌌","follow","M","CT"],
    ["dm010","2026-04-15","7PM","TikTok / IG Reels","release","new music incoming 🌌⚫","follow","H","CT"],
    ["dm011","2026-04-22","6PM","IG","release","🌌  (something heavy is coming)","follow","H","CT"],
    ["dm012","2026-04-28","7PM","TikTok / IG Reels","release","releasing this one soon 🌌 stay tuned","follow","H","CT"],
  ],
  kotrax: [
    ["kt001","2026-03-05","7PM","IG+TT","branding","bass music. no filter. ⚡","follow","M","MT"],
    ["kt002","2026-03-09","6PM","IG/FB","tour","ALBUQUERQUE 🛸⚡ March 6 with @dirtysnatcha  we had ABQ going crazy. thank you Effex for having us","follow","H","MT"],
    ["kt003","2026-03-12","9PM","Story","tour","Tampa tomorrow ⚡🌴 supporting @dirtysnatcha · take me to your leader tour","tickets","H","MT"],
    ["kt004","2026-03-13","8PM","Story","tour","TONIGHT. Tampa. ⚡🌴 let's get it","tag","H","MT"],
    ["kt005","2026-03-14","2PM","IG","tour","FLORIDA ⚡🌴 Tampa spring break dubstep invasion. we don't miss  thank you @dirtysnatcha for having us on thi...","follow","H","MT"],
    ["kt006","2026-03-18","7PM","TikTok / IG Reels","release","DSR catalog ⚡ go stream it","stream","H","MT"],
    ["kt007","2026-03-22","6PM","IG","branding","cooking ⚡  new music almost ready","follow","M","MT"],
    ["kt008","2026-03-26","7PM","TikTok / IG Reels","release","this one's been running for a minute ⚡ go save it if you haven't","save","H","MT"],
    ["kt009","2026-04-01","7PM","TikTok / IG Reels","branding","live sets > everything ⚡","follow","M","MT"],
    ["kt010","2026-04-07","6PM","IG/FB","release","new music incoming ⚡  first solo single of 2026. dates soon","follow","H","MT"],
    ["kt011","2026-04-14","9PM","Story","release","dropping a single soon ⚡ stay ready [Countdown sticker to release date]","follow","H","MT"],
    ["kt012","2026-04-21","7PM","TikTok / IG Reels","release","NEW MUSIC ⚡🔥 Kotrax on DSR — go stream it now  link in bio","stream","H","MT"],
  ],
  dsr_label: [
    ["dsr001","2026-03-04","12PM","ALL","release","OUT NOW 🔴  Drugs In Da Club — DirtySnatcha [DSR178]  link in bio","stream","H","ET"],
    ["dsr002","2026-03-06","3PM","IG/FB","tour","ALBUQUERQUE TONIGHT 🛸  @dirtysnatcha · Take Me To Your Leader Tour Effex Nightclub · w/ Kotrax · Mport · HV...","tickets","H","MT"],
    ["dsr003","2026-03-09","11AM","ALL","branding","DirtySnatcha Records · DSR002–DSR178  154 releases. 116 artists. all dubstep. all VMG. 🏷️  if you're making...","demos","M","ET"],
    ["dsr004","2026-03-11","6PM","IG+TT","branding","@whoisee · DSR artist spotlight 👁️  Magic has been finding people on its own for months. now we're pushing ...","search","H","ET"],
    ["dsr005","2026-03-13","2PM","IG/FB","tour","TAMPA TONIGHT 🛸🌴  @dirtysnatcha · Take Me To Your Leader Tour Spring Break dubstep invasion","tickets","H","ET"],
    ["dsr006","2026-03-14","2PM","IG/FB","tour","PITTSBURGH TONIGHT 🛸  @dirtysnatcha + @whoisee + Dark Matter SideQuest · Take Me To Your Leader Tour  3 DSR...","tickets","H","ET"],
    ["dsr007","2026-03-17","12PM","ALL","branding","Kotrax · DSR artist spotlight ⚡  been in the catalog since day one. 7 releases on DSR. new music incoming. ...","search","M","ET"],
    ["dsr008","2026-03-20","11AM","ALL","release","demos open 🏷️  DirtySnatcha Records is accepting submissions.  dubstep. bass music. no fluff. demos@dirtysn...","demos","H","ET"],
    ["dsr009","2026-03-24","6PM","IG+TT","branding","Dark Matter · DSR artist spotlight 🌌  Wakaan release. Chicago. Knoxville. on the Take Me To Your Leader tou...","search","M","ET"],
    ["dsr010","2026-03-27","1PM","IG/FB","tour","OKC TONIGHT 🛸  @dirtysnatcha · Take Me To Your Leader Tour","tickets","H","CT"],
    ["dsr011","2026-03-31","12PM","ALL","branding","OZZTIN · DSR catalog   hit the back catalog. OZZTIN has been putting in work.  DirtySnatcha Records · alway...","stream","M","ET"],
    ["dsr012","2026-04-02","12PM","IG/FB","tour","DENVER THIS WEEKEND 🛸🏔️  @dirtysnatcha · Take Me To Your Leader Tour","tickets","H","MT"],
    ["dsr013","2026-04-07","11AM","ALL","release","next release incoming 🏷️  DirtySnatcha Records · DSR179  dates soon.","follow","H","ET"],
    ["dsr014","2026-04-09","3PM","IG/FB","tour","KANSAS CITY THIS WEEKEND 🛸  @dirtysnatcha · Take Me To Your Leader Tour the midwest run","tickets","M","CT"],
    ["dsr015","2026-04-10","9AM","ALL","release","OUT NOW 🔴  [DSR179 release title — TBD] · [Artist TBD]  link in bio","stream","H","ET"],
    ["dsr016","2026-04-14","11AM","IG+TT","release","WHOiSEE x Circus Records 👁️🎪  DSR artist. Circus Records UK EP incoming.  big things happening in the roste...","follow","H","ET"],
    ["dsr017","2026-04-16","6PM","IG/FB","tour","TUCSON THIS SATURDAY 🛸🌵  @dirtysnatcha · DirtyT · Rialto Theatre  one of the biggest shows of the tour. if ...","tickets","H","MT"],
    ["dsr018","2026-04-21","11AM","ALL","branding","MAVIC · DSR catalog 🏷️  go run the back catalog. MAVIC has been building.  DirtySnatcha Records · search MA...","search","M","ET"],
    ["dsr019","2026-04-24","12PM","IG/FB","tour","EAST COAST RUN 🛸  @dirtysnatcha · Asbury Park Friday · Hartford Saturday House of Independents + CT","tickets","H","ET"],
    ["dsr020","2026-04-28","11AM","ALL","tour","TOUR FINALE 🛸🏔️  @dirtysnatcha · May 2 · Butte, Montana Covellite Theatre · MAD Series  the last night of T...","tickets","H","MT"],
    ["dsr021","2026-05-03","12PM","ALL","tour","Take Me To Your Leader 2026 🛸  17 cities. 17 nights. DirtySnatcha Records on the road.  thank you to everyo...","follow","H","ET"],
    ["dsr022","2026-05-05","11AM","ALL","release","demos open 🏷️  we just finished a 17-city tour. now back to the label.  dubstep. bass music. no fluff. demo...","demos","H","ET"],
    ["dsr023","2026-05-08","11AM","ALL","branding","PRIYANX · DSR catalog 🏷️  going deep in the catalog this week. PRIYANX has been there since the beginning. ...","search","M","ET"],
    ["dsr024","2026-05-12","12PM","ALL","release","next release incoming 🏷️  DirtySnatcha Records · DSR180  dates soon.","follow","H","ET"],
    ["dsr025","2026-05-15","11AM","IG+TT","branding","WHOiSEE Circus EP 👁️🎪  pre-save is live. DSR artist. Circus Records UK.  big summer incoming 🏷️  link in bio","pre-save","H","ET"],
  ],
};
function decodePost(t, artist) {
  return { id:t[0], date:t[1], time:t[2], platform:t[3], postType:t[3],
           category:t[4], caption:t[5], cta:t[6],
           priority:t[7]==='H'?'high':'med', timezone:t[8], artist };
}
const CC = Object.fromEntries(
  Object.entries(CONTENT_CALENDAR).map(([k,v])=>[k,v.map(t=>decodePost(t,k))])
);

const CATEGORY_CONFIG = {
  tour:     { label: "Tour",    color: "#f59e0b", icon: "🎤" },
  release:  { label: "Release", color: "#00ff88", icon: "🎵" },
  branding: { label: "Brand",   color: "#60a5fa", icon: "✦"  },
};

const PLATFORM_COLORS = {
  "IG / FB":            "#e1306c",
  "IG / FB / X":        "#e1306c",
  "IG":                 "#e1306c",
  "IG Stories":         "#e1306c",
  "IG Reels / TikTok":  "#00f2ea",
  "IG Reels / TikTok / YouTube": "#00f2ea",
  "TikTok":             "#00f2ea",
  "TikTok / IG Reels":  "#00f2ea",
  "X / Twitter":        "#1d9bf0",
  "YouTube":            "#ff0000",
};

function getWeekLabel(dateStr) {
  const d = new Date(dateStr);
  const opts = { month: "short", day: "numeric" };
  return d.toLocaleDateString("en-US", opts);
}

function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const monday = new Date(d); monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const fmt = (x) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

function groupByWeek(posts) {
  const weeks = {};
  posts.forEach(p => {
    const d = new Date(p.date);
    const day = d.getDay();
    const monday = new Date(d); monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
    const key = monday.toISOString().split("T")[0];
    if (!weeks[key]) weeks[key] = [];
    weeks[key].push(p);
  });
  return weeks;
}

function PostCard({ post, color, onApprove, onReject, approvedIds, rejectedIds }) {
  const cat = CATEGORY_CONFIG[post.category] || CATEGORY_CONFIG.branding;
  const platColor = PLATFORM_COLORS[post.platform] || "#aaa";
  const isApproved = approvedIds.has(post.id);
  const isRejected = rejectedIds.has(post.id);

  return (
    <div className="rounded-xl p-3 mb-2" style={{background: isApproved ? "rgba(0,255,136,0.05)" : isRejected ? "rgba(255,80,80,0.05)" :"rgba(255,255,255,0.03)",border: isApproved ? "1px solid rgba(0,255,136,0.2)" : isRejected ? "1px solid rgba(255,80,80,0.15)" :"1px solid rgba(255,255,255,0.07)",}}>
      {/* Top row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:`${cat.color}20`,color: cat.color}}>
          {cat.icon} {cat.label}
        </span>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{background:`${platColor}18`,color: platColor}}>
          {post.platform}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.5)"}}>
          {post.postType}
        </span>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-xs font-mono" style={{color:"rgba(255,255,255,0.35)"}}>
            🕐 {post.time}
          </span>
          {(() => { const tz = post.timezone||"ET"; return (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{background:`${TZ_COLORS[tz] || "#60a5fa"}18`,color: TZ_COLORS[tz] || "#60a5fa",fontSize: 10}}>{tz}</span>
          ); })()}
        </div>
      </div>

      {/* Caption */}
      <div className="text-xs mb-2 leading-relaxed" style={{color:"rgba(255,255,255,0.75)",fontStyle:"italic",whiteSpace:"pre-line"}}>
        {(post.caption||"").length > 160 ? (post.caption||"").slice(0,160)+"…" : (post.caption||"")}
      </div>

      {post.asset && (
        <div className="flex items-start gap-1.5 mb-2">
          <span className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>{'📎'}</span>
          <span className="text-xs" style={{color:"rgba(255,255,255,0.45)"}}>{post.asset}</span>
        </div>
      )}

      {/* TikTok SEO title */}
      {post.tiktokTitle && (
        <div className="flex items-start gap-1.5 mb-2 rounded-lg px-2 py-1.5" style={{background:"rgba(0,242,234,0.06)",border:"1px solid rgba(0,242,234,0.15)"}}>
          <span className="text-xs mt-0.5">{'🔍'}</span>
          <div>
            <div className="text-xs font-bold mb-0.5" style={{color:"#00f2ea"}}>TikTok SEO Title</div>
            <div className="text-xs" style={{color:"rgba(255,255,255,0.65)"}}>{post.tiktokTitle}</div>
          </div>
        </div>
      )}

      {/* Algorithm note */}
      {post.algorithmNote && (
        <div className="flex items-start gap-1.5 mb-2 rounded-lg px-2 py-1.5" style={{background:"rgba(250,204,21,0.06)",border:"1px solid rgba(250,204,21,0.15)"}}>
          <span className="text-xs mt-0.5">{'⚡'}</span>
          <div>
            <div className="text-xs font-bold mb-0.5" style={{color:"#facc15"}}>Algorithm Hack</div>
            <div className="text-xs" style={{color:"rgba(255,255,255,0.65)"}}>{post.algorithmNote || ""}</div>
          </div>
        </div>
      )}

      {/* Engagement window */}
      {post.engagementWindow && (
        <div className="flex items-start gap-1.5 mb-2 rounded-lg px-2 py-1.5" style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)"}}>
          <span className="text-xs mt-0.5">⏱</span>
          <div>
            <div className="text-xs font-bold mb-0.5" style={{color:"#ef4444"}}>Engagement Window</div>
            <div className="text-xs" style={{color:"rgba(255,255,255,0.65)"}}>{post.engagementWindow}</div>
          </div>
        </div>
      )}

      {/* Hashtag set */}
      {post.hashtagSet && (
        <div className="flex items-start gap-1.5 mb-2">
          <span className="text-xs mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>#</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)"}}>
            Hashtag Set {post.hashtagSet}
          </span>
        </div>
      )}

      {/* CTA + approve row */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.4)"}}>
          CTA: {post.cta}
        </span>
        <div className="flex gap-1.5 ml-auto">
          {isApproved ? (
            <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{background:"rgba(0,255,136,0.15)",color:"#00ff88"}}>{'✓ Approved'}</span>
          ) : isRejected ? (
            <span className="text-xs font-bold px-3 py-1 rounded-lg" style={{background:"rgba(255,80,80,0.12)",color:"#ff5050"}}>{'✕ Rejected'}</span>
          ) : (
            <>
              <button onClick={() => onReject(post.id)} className="text-xs px-3 py-1 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{background:"rgba(255,80,80,0.1)",color:"#ff5050",border:"1px solid rgba(255,80,80,0.2)"}}>
                ✕
              </button>
              <button onClick={() => onApprove(post.id)} className="text-xs px-3 py-1 rounded-lg font-semibold transition-all hover:opacity-80"
                style={{background:`${color}15`,color: color,border:`1px solid ${color}35`}}>
                ✓ Approve
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ContentCalendarView({ entity }) {
  const color = entity.color;
  const artistId = entity.id;
  const [filter, setFilter] = useState("all");
  const [approvedIds, setApprovedIds] = useState(new Set());
  const [rejectedIds, setRejectedIds] = useState(new Set());
  const [expandedWeeks, setExpandedWeeks] = useState({});

  const posts = CC[artistId] || [];
  const filtered = filter === "all" ? posts : posts.filter(p => p.category === filter);
  const byWeek = groupByWeek([...filtered].sort((a,b) => new Date(a.date) - new Date(b.date)));
  const weekKeys = Object.keys(byWeek).sort();

  const approveAll = (weekKey) => {
    const ids = byWeek[weekKey].map(p => p.id);
    setApprovedIds(prev => { const s = new Set(prev); ids.forEach(id => s.add(id)); return s; });
  };

  const toggleWeek = (k) => setExpandedWeeks(prev => ({ ...prev, [k]: !prev[k] }));

  const totalApproved = approvedIds.size;
  const totalPosts = posts.length;

  return (
    <div className="p-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: "Total Posts", val: totalPosts },
          { label: "Approved", val: totalApproved, color: "#00ff88" },
          { label: "Pending", val: totalPosts - totalApproved - rejectedIds.size, color: color },
        ].map((s,i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-lg font-bold" style={{color: s.color || "white"}}>{s.val}</div>
            <div className="text-xs" style={{color:"rgba(255,255,255,0.35)"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[["all","All","#fff"],["tour","Tour","#f59e0b"],["release","Release","#00ff88"],["branding","Brand","#60a5fa"]].map(([id,label,c]) => (
          <button key={id} onClick={() => setFilter(id)}
            className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
            style={{background: filter === id ? `${c}20` :"rgba(255,255,255,0.05)",color: filter === id ? c :"rgba(255,255,255,0.4)",border: filter === id ? `1px solid ${c}40` :"1px solid transparent"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Week groups */}
      {weekKeys.map(wk => {
        const weekPosts = byWeek[wk].sort((a,b) => new Date(a.date+' '+a.time) - new Date(b.date+' '+b.time));
        const isOpen = expandedWeeks[wk] !== false; // default open
        const weekApproved = weekPosts.filter(p => approvedIds.has(p.id)).length;
        return (
          <div key={wk} className="mb-4">
            <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => toggleWeek(wk)}>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold" style={{color}}>{getWeekRange(wk)}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.35)"}}>
                  {weekPosts.length} posts
                </span>
                {weekApproved > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(0,255,136,0.1)",color:"#00ff88"}}>
                    {weekApproved} ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); approveAll(wk); }}
                  className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{background:`${color}12`,color,border:`1px solid ${color}25`}}>
                  Approve All
                </button>
                <span style={{color:"rgba(255,255,255,0.3)",fontSize: 12}}>{isOpen ? "▲" : "▼"}</span>
              </div>
            </div>
            {isOpen && weekPosts.map(post => (
              <PostCard key={post.id} post={post} color={color}
                approvedIds={approvedIds} rejectedIds={rejectedIds}
                onApprove={(id) => setApprovedIds(prev => { const s = new Set(prev); s.add(id); return s; })}
                onReject={(id) => setRejectedIds(prev => { const s = new Set(prev); s.add(id); return s; })} />
            ))}
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{color:"rgba(255,255,255,0.25)"}}>
          <div className="text-3xl mb-2">{'📅'}</div>
          <div className="text-sm">No posts in this category</div>
        </div>
      )}
    </div>
  );
}

const ARTIST_META = {
  dirtysnatcha: { name: "DirtySnatcha",         color: "#00ff88", emoji: "🛸" },
  whoisee:      { name: "WHOiSEE",              color: "#a855f7", emoji: "👁️" },
  darkmatter:   { name: "Dark Matter",          color: "#06b6d4", emoji: "🌌" },
  kotrax:       { name: "Kotrax",               color: "#f97316", emoji: "⚡" },
  dsr_label:    { name: "DSR Label",            color: "#dc2626", emoji: "🏷️" },
};

function MasterCalendarView() {
  const [filter, setFilter] = useState("all");
  const [artistFilter, setArtistFilter] = useState("all");
  const [approvedIds, setApprovedIds] = useState(new Set());
  const [rejectedIds, setRejectedIds] = useState(new Set());

  const allPosts = Object.values(CC).flat();
  let filtered = allPosts;
  if (filter !== "all") filtered = filtered.filter(p => p.category === filter);
  if (artistFilter !== "all") filtered = filtered.filter(p => p.artist === artistFilter);
  filtered = filtered.sort((a,b) => new Date(a.date+"T"+a.time.replace(" ","")) - new Date(b.date+"T"+b.time.replace(" ","")));

  const byWeek = groupByWeek(filtered);
  const weekKeys = Object.keys(byWeek).sort();

  const totalApproved = approvedIds.size;
  const totalPending = allPosts.length - approvedIds.size - rejectedIds.size;

  return (
    <div className="p-4">
      {/* Header stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: "All Posts", val: allPosts.length, color: "#f59e0b" },
          { label: "Approved",  val: totalApproved,   color: "#00ff88" },
          { label: "Pending",   val: totalPending,    color: "#60a5fa" },
          { label: "Rejected",  val: rejectedIds.size,color: "#ff5050" },
        ].map((s,i) => (
          <div key={i} className="rounded-xl p-3 text-center" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)"}}>
            <div className="text-lg font-bold" style={{color: s.color}}>{s.val}</div>
            <div className="text-xs" style={{color:"rgba(255,255,255,0.35)"}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Artist filter */}
      <div className="flex gap-1.5 mb-3 flex-wrap">
        <button onClick={() => setArtistFilter("all")}
          className="text-xs px-2.5 py-1 rounded-full font-semibold"
          style={{background: artistFilter==="all" ? "rgba(255,255,255,0.15)" :"rgba(255,255,255,0.05)",color: artistFilter==="all" ? "#fff" :"rgba(255,255,255,0.35)",border:"1px solid transparent"}}>
          All Artists
        </button>
        {Object.entries(ARTIST_META).map(([id, a]) => (
          <button key={id} onClick={() => setArtistFilter(id)}
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{background: artistFilter===id ? `${a.color}20` :"rgba(255,255,255,0.05)",color: artistFilter===id ? a.color :"rgba(255,255,255,0.35)",border: artistFilter===id ? `1px solid ${a.color}35` :"1px solid transparent"}}>
            {a.emoji} {a.name}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {[["all","All"],["tour","🎤 Tour"],["release","🎵 Release"],["branding","✦ Brand"]].map(([id,label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{background: filter===id ? "rgba(255,255,255,0.1)" :"rgba(255,255,255,0.04)",color: filter===id ? "#fff" :"rgba(255,255,255,0.35)"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Weekly timeline */}
      {weekKeys.map(wk => {
        const weekPosts = byWeek[wk];
        const wkApproved = weekPosts.filter(p => approvedIds.has(p.id)).length;
        return (
          <div key={wk} className="mb-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{color:"#f59e0b"}}>{getWeekRange(wk)}</span>
              <div className="flex items-center gap-2">
                {wkApproved > 0 && <span className="text-xs" style={{color:"#00ff88"}}>{wkApproved} approved</span>}
                <button onClick={() => { const ids = weekPosts.map(p => p.id); setApprovedIds(prev => { const s = new Set(prev); ids.forEach(id => s.add(id)); return s; }); }} className="text-xs px-2 py-1 rounded-lg font-semibold"
                  style={{background:"rgba(0,255,136,0.08)",color:"#00ff88",border:"1px solid rgba(0,255,136,0.2)"}}>
                  Approve All
                </button>
              </div>
            </div>
            {weekPosts.map(post => {
              const a = ARTIST_META[post.artist] || {};
              const cat = CATEGORY_CONFIG[post.category] || {};
              const platColor = PLATFORM_COLORS[post.platform] || "#aaa";
              const isApproved = approvedIds.has(post.id);
              const isRejected = rejectedIds.has(post.id);
              return (
                <div key={post.id} className="rounded-xl p-3 mb-2" style={{background: isApproved ? "rgba(0,255,136,0.04)" : isRejected ? "rgba(255,80,80,0.04)" :"rgba(255,255,255,0.02)",border: isApproved ? "1px solid rgba(0,255,136,0.15)" : isRejected ? "1px solid rgba(255,80,80,0.12)" :"1px solid rgba(255,255,255,0.06)",}}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {/* Artist badge */}
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:`${a.color}18`,color: a.color}}>
                      {a.emoji} {a.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{background:`${cat.color}15`,color: cat.color}}>
                      {cat.icon} {cat.label}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{background:`${platColor}15`,color: platColor}}>
                      {post.platform}
                    </span>
                    <span className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>
                      {getWeekLabel(post.date)} · {post.time}
                    </span>
                    {(() => { const tz = post.timezone||"ET"; return (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{background:`${TZ_COLORS[tz]}18`,color: TZ_COLORS[tz],fontSize: 10}}>{tz}</span>
                    ); })()}
                    <div className="ml-auto flex gap-1.5">
                      {isApproved ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{color:"#00ff88"}}>{'✓ Approved'}</span>
                      ) : isRejected ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg" style={{color:"#ff5050"}}>{'✕ Rejected'}</span>
                      ) : (
                        <>
                          <button onClick={() => setRejectedIds(prev => { const s = new Set(prev); s.add(post.id); return s; })}
                            className="text-xs px-2 py-0.5 rounded-lg" style={{background:"rgba(255,80,80,0.1)",color:"#ff5050"}}>{'✕'}</button>
                          <button onClick={() => setApprovedIds(prev => { const s = new Set(prev); s.add(post.id); return s; })}
                            className="text-xs px-2 py-0.5 rounded-lg" style={{background:"rgba(0,255,136,0.1)",color:"#00ff88"}}>{'✓'}</button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-xs" style={{color:"rgba(255,255,255,0.55)",fontStyle:"italic"}}>
                    {(post.caption||"").length > 120 ? (post.caption||"").slice(0,120)+"…" : (post.caption||"")}
                  </div>
                  <div className="text-xs mt-1" style={{color:"rgba(255,255,255,0.3)"}}>
                    {post.asset && (post.asset.length > 80 ? post.asset.slice(0,80)+"…" : post.asset)}
                  </div>
                  {post.algorithmNote && (
                    <div className="text-xs mt-1.5 px-2 py-1 rounded-lg" style={{background:"rgba(250,204,21,0.07)",color:"#facc15"}}>
                      ⚡ {post.algorithmNote.length > 100 ? post.algorithmNote.slice(0,100)+"…" : post.algorithmNote}
                    </div>
                  )}
                  {post.tiktokTitle && (
                    <div className="text-xs mt-1 px-2 py-1 rounded-lg" style={{background:"rgba(0,242,234,0.06)",color:"#00f2ea"}}>
                      🔍 TikTok title: {post.tiktokTitle}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DashboardView({ entity, onBack }) {
  const [tab, setTab] = useState("overview");
  const color = entity.color;
  const hasCatalog = ["dirtysnatcha", "whoisee", "manager", "dsr_label"].includes(entity.id);
  const hasCalendar = ["dirtysnatcha", "whoisee", "darkmatter", "kotrax", "manager", "dsr_label"].includes(entity.id);

  const tabs = [
    { id: "overview",  label: "Overview",  icon: "📊" },
    ...(hasCatalog   ? [{ id: "catalog",  label: "Catalog",  icon: "💿" }] : []),
    ...(hasCalendar  ? [{ id: "calendar", label: "Content",  icon: "📅" }] : []),
    { id: "chat",    label: "Chat",     icon: "⚡" },
  ];

  return (
    <div className="flex flex-col h-screen" style={{background:"#0a0a0f"}}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
        <button onClick={onBack} className="text-sm px-3 py-1 rounded-lg"
          style={{background:"rgba(255,255,255,0.07)",color:"rgba(255,255,255,0.5)"}}>
          ←
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
            style={{background:`${color}18`,border:`1px solid ${color}35`}}>
            {entity.emoji}
          </div>
          <div>
            <div className="text-sm font-bold" style={{color}}>{entity.name}</div>
            <div className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{entity.label}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:"#00ff88"}} />
          <span className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>Live</span>
        </div>
      </div>

      {/* Tab Nav */}
      <div className="flex px-4 py-2 gap-1 flex-shrink-0"
        style={{borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{background: tab === t.id ? `${color}18` :"transparent",color: tab === t.id ? color :"rgba(255,255,255,0.4)",border: tab === t.id ? `1px solid ${color}30` :"1px solid transparent"}}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "overview"  && <OverviewView entity={entity} />}
        {tab === "catalog"   && <CatalogView entity={entity} />}
        {tab === "calendar"  && (entity.id === "manager" ? <MasterCalendarView /> : <ContentCalendarView entity={entity} />)}
        {tab === "chat"      && <ChatTab entity={entity} />}
      </div>
    </div>
  );
}

function PasscodeModal({ entity, onSuccess, onCancel }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const check = () => {
    if (code.toUpperCase() === entity.passcode) { onSuccess(); }
    else { setError(true); setCode(""); setTimeout(() => setError(false), 1000); }
  };
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 px-4"
      style={{background:"rgba(0,0,0,0.85)",backdropFilter:"blur(10px)"}}>
      <div className="rounded-2xl p-6 w-full max-w-sm"
        style={{background:"#111118",border:`1px solid ${entity.color}33`}}>
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{entity.emoji}</div>
          <div className="text-base font-bold text-white mb-1">{entity.name}</div>
          <div className="text-xs" style={{color:"rgba(255,255,255,0.35)"}}>Enter access code</div>
        </div>
        <input ref={inputRef} type="password" value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === "Enter" && check()}
          placeholder="••••••"
          className="w-full text-center text-xl tracking-widest rounded-xl px-4 py-3 outline-none mb-4"
          style={{background:"rgba(255,255,255,0.05)",border:`1px solid ${error ? "#ef4444" : entity.color + "44"}`,color: error ? "#ef4444" :"white",letterSpacing:"0.4em",transition:"border-color 0.2s"}} />
        {error && <p className="text-center text-xs text-red-400 mb-3">Incorrect. Try again.</p>}
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-sm"
            style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.45)"}}>
            Cancel
          </button>
          <button onClick={check} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{background: entity.color,color:"#000"}}>
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}

function ArtistCard({ entity, onSelect }) {
  const color = entity.color;
  return (
    <button onClick={() => onSelect(entity)}
      className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.015] active:scale-[0.98]"
      style={{background:"rgba(255,255,255,0.035)",border:`1px solid ${color}28`}}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
          style={{background:`${color}18`,border:`1px solid ${color}30`}}>
          {entity.emoji}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{entity.name}</div>
          <div className="text-xs" style={{color}}>{entity.label}</div>
        </div>
      </div>
      <p className="text-xs leading-relaxed mb-3" style={{color:"rgba(255,255,255,0.4)"}}>
        {entity.tagline}
      </p>
      {entity.profile && (
        <div className="flex flex-wrap gap-1.5">
          {entity.profile.genre && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{background:`${color}15`,color}}>
              {entity.profile.genre.split(" / ")[0]}
            </span>
          )}
          {entity.profile.location && (
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.4)"}}>
              {entity.profile.location}
            </span>
          )}
          {entity.profile.active_release && (
            <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{background: color + "18",color}}>
              🎵 {entity.profile.active_release.split("(")[0].trim()}
            </span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-3 pt-3"
        style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <span className="text-xs" style={{color:"rgba(255,255,255,0.25)"}}>Tap to enter</span>
        <span style={{color}}>→</span>
      </div>
    </button>
  );
}

function AppCore() {
  const [selected, setSelected] = useState(null);
  const [authenticated, setAuthenticated] = useState(null);
  const [showPasscode, setShowPasscode] = useState(false);

  const handleSelect = (entity) => { setSelected(entity); setShowPasscode(true); };
  const handleAuth = () => { setShowPasscode(false); setAuthenticated(selected); };
  const handleBack = () => { setAuthenticated(null); setSelected(null); };

  if (authenticated) {
    return <DashboardView entity={authenticated} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen" style={{background:"#0a0a0f"}}>
      {/* Header */}
      <div className="px-4 pt-10 pb-5 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
          style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)"}}>
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{background:"#00ff88"}} />
          <span className="text-xs font-medium" style={{color:"rgba(255,255,255,0.45)"}}>
            TENx10 Platform
          </span>
        </div>
        <h1 className="text-4xl font-black text-white mb-1.5 tracking-tighter">
          TEN<span style={{color:"#00ff88"}}>x10</span>
        </h1>
        <p className="text-sm" style={{color:"rgba(255,255,255,0.3)"}}>
          Select your profile
        </p>
      </div>

      {/* Manager Card */}
      <div className="px-4 mb-3">
        <button onClick={() => handleSelect(MANAGER)}
          className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01]"
          style={{background:"linear-gradient(135deg,rgba(245,158,11,0.1),rgba(239,68,68,0.06))",border:"1px solid rgba(245,158,11,0.28)"}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{background:"rgba(245,158,11,0.18)",border:"1px solid rgba(245,158,11,0.3)"}}>
                ⚡
              </div>
              <div>
                <div className="font-bold text-white text-sm">Manager Dashboard</div>
                <div className="text-xs" style={{color:"rgba(245,158,11,0.75)"}}>
                  Thomas Nalian · 4 Artists · DSR Label
                </div>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{background:"rgba(245,158,11,0.18)",color:"#f59e0b"}}>
              Admin
            </span>
          </div>
        </button>
      </div>

      {/* DSR Label Card */}
      <div className="px-4 mb-3">
        <button onClick={() => handleSelect(DSR_LABEL)}
          className="w-full text-left rounded-2xl p-5 transition-all hover:scale-[1.01]"
          style={{background:"linear-gradient(135deg,rgba(220,38,38,0.1),rgba(248,113,113,0.04))",border:"1px solid rgba(220,38,38,0.28)"}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                style={{background:"rgba(220,38,38,0.18)",border:"1px solid rgba(220,38,38,0.3)"}}>
                {"🏷️"}
              </div>
              <div>
                <div className="font-bold text-white text-sm">DirtySnatcha Records</div>
                <div className="text-xs" style={{color:"rgba(220,38,38,0.8)"}}>
                  154 releases · 116 artists · VMG
                </div>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full font-semibold"
              style={{background:"rgba(220,38,38,0.18)",color:"#dc2626"}}>
              Label
            </span>
          </div>
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(220,38,38,0.1)",color:"#f87171"}}>DSR002–DSR178</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.35)"}}>98% Dubstep</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"rgba(255,255,255,0.05)",color:"rgba(255,255,255,0.35)"}}>Virgin Music Group</span>
          </div>
        </button>
      </div>

      <div className="flex items-center gap-3 px-4 my-3">
        <div className="flex-1 h-px" style={{background:"rgba(255,255,255,0.06)"}} />
        <span className="text-xs" style={{color:"rgba(255,255,255,0.2)"}}>Artists</span>
        <div className="flex-1 h-px" style={{background:"rgba(255,255,255,0.06)"}} />
      </div>

      <div className="px-4 flex flex-col gap-3 pb-10">
        {Object.values(ARTISTS).map(artist => (
          <ArtistCard key={artist.id} entity={artist} onSelect={handleSelect} />
        ))}
      </div>

      <div className="text-center pb-8">
        <p className="text-xs" style={{color:"rgba(255,255,255,0.12)"}}>
          TENx10 · v0.2 · March 2026
        </p>
      </div>

      {showPasscode && selected && (
        <PasscodeModal
          entity={selected}
          onSuccess={handleAuth}
          onCancel={() => { setShowPasscode(false); setSelected(null); }}
        />
      )}
    </div>
  );
}

export default function App() {
  return <ErrorBoundary><AppCore /></ErrorBoundary>;
}
