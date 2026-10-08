/* Skill tree catalogue. Format: ID | Trick / challenge | Difficulty 1-5 | Prerequisite IDs (comma-separated).
   Freestyle naming varies by community; some entries are drills, directional variations or combinations.
   These links are suggested learning paths, not formal certification requirements. */
const SKILL_DATA = `
C01|Alternating thigh juggles|1|
C02|Right-foot kick-ups|1|C01
C03|Left-foot kick-ups|1|C01
C04|10 alternating foot juggles|1|C02,C03
C05|30 consecutive juggles|1|C04
C06|100 consecutive juggles|2|C05
C07|Low-height controlled juggling|2|C05
C08|20 weak-foot-only juggles|2|C03
C09|Thigh-to-foot juggling patterns|2|C01,C04
C10|200-touch juggling endurance|3|C06
L01|Crossover|1|C04
L02|Reverse Crossover|2|L01
L03|X-over|2|L01
L04|Toe Bounce|2|L01
L05|Reverse Toe Bounce|2|L04
L06|Inside Around the World (ATW)|2|C05
L07|Outside Around the World (ATW)|2|C05
L08|Inside Hop the World (HTW)|2|L06
L09|Outside Hop the World (HTW)|2|L07
L10|Half Around the World (HATW)|2|L06
L11|Knee Around the World|3|L06,C09
L12|Knee Hop the World|3|L08,C09
L13|Crossover 360|3|L01
L14|X-over 360|3|L03
L15|Toe Bounce 360|3|L04
L16|Touzani ATW (TATW)|3|L07,L01
L17|Mitchy ATW (MATW)|3|L06,L01
L18|Abbas ATW (AATW)|3|L02,L06
L19|Ratinho ATW (RATW)|3|L07,L03
L20|Alternative Touzani ATW (ATATW)|4|L09,L01
L21|Alternative Mitchy ATW (AMATW)|4|L08,L01
L22|Mirror ATW|3|L06,L07
L23|Dore ATW (DATW)|3|L06,L07
L24|Timo ATW|4|L16,L18
L25|Knee Mitchy ATW (KMATW)|4|L11,L17
L26|Knee Touzani ATW (KTATW)|4|L11,L16
L27|Homie Touzani ATW (HTATW)|4|L16,L08
L28|Homie Mitchy ATW (HMATW)|4|L17,L08
L29|Homie Jay ATW (HJATW)|4|L07,L09
L30|Inside Lemmens ATW (LATW)|4|L06
L31|Outside Lemmens ATW (LATW)|4|L07
L32|Magellan outside-inside|4|L06,L07
L33|Magellan inside-outside|4|L06,L07
L34|Alternative Lemmens ATW (ALATW)|5|L30,L08
L35|Lemmens Touzani ATW (LTATW)|5|L31,L16
L36|Lemmens Mitchy ATW (LMATW)|5|L30,L17
L37|Palle Trick|5|L27,L01
L38|Palle Around the World (PATW)|5|L30,L31
L39|Palle Touzani ATW (PTATW)|5|L38,L16
L40|Skóra ATW (SATW)|5|L20,L27
U01|Head juggling|1|C01
U02|Forehead Head Stall|2|U01
U03|Left Side Head Stall|2|U02
U04|Right Side Head Stall|2|U02
U05|Neck Catch / Neck Stall|2|U01
U06|Neck Flick|2|U05
U07|Chest Catch / Chest Stall|2|U01
U08|Left Shoulder Stall|3|U05,U07
U09|Right Shoulder Stall|3|U05,U07
U10|Head-to-Neck Transfer|3|U02,U05
U11|Neck-to-Head Transfer|3|U02,U06
U12|Chest-to-Head Transfer|3|U02,U07
U13|Neck Roll|4|U05,U08,U09
U14|Shoulder-to-Shoulder Roll|4|U08,U09
U15|Around the Moon (ATM)|4|U05
U16|Top-of-Head Stall|3|U02
U17|Back-of-Head Stall|4|U05,U16
U18|Nose Stall|4|U02
U19|Lip Stall|5|U18
U20|Carousel Upper Combo|5|U13,U14
S01|Seated Right-Foot Juggling|1|C02
S02|Seated Left-Foot Juggling|1|C03
S03|Alternating Seated Juggles|2|S01,S02
S04|Seated Thigh-to-Foot Switch|2|S03,C09
S05|Sitdown Crossover|2|S03,L01
S06|Sitdown Reverse Crossover|2|S05
S07|Sitdown X-over|2|S05
S08|Seated Inside ATW|3|S03,L06
S09|Seated Outside ATW|3|S03,L07
S10|Seated Half ATW|3|S08
S11|Shin Stall|3|S03
S12|Shin Juggling|3|S11
S13|Shin Roll|4|S12
S14|Sole Stall|3|S03
S15|Sole Juggling|4|S14
S16|Raised Sole Stall Swipe|4|S14
S17|Bicycle Stall|4|S14
S18|Inside Revolve|3|S05
S19|Outside Revolve|3|S05
S20|Advanced Bicycle/Sole Combination|5|S15,S17
B01|Foot Stall|1|C02
B02|Foot Stall Transfer|2|B01
B03|Knee Catch|2|C01
B04|Ankle Catch|2|B03
B05|Crossed Ankle Catch|3|B04
B06|Level Foot Clutch|2|B01
B07|Front Foot Clutch|2|B06
B08|Tail Foot Clutch|3|B06
B09|Knee Clutch|2|B03
B10|Chest Pinch|3|U07,B03
B11|Clipper Stall|3|B01
B12|Pancake|3|B01
B13|Dragon Stall|4|B11
B14|Vee Stall|4|B01,B11
B15|Knee Stall|3|B03
B16|Heel Stall|3|B01
B17|Butterfly Stall|4|B11
B18|Eclipse|5|B11,B16
B19|Handstand Clutch|5|B07
B20|Jordan Stall|5|B11
T01|Ground-to-Foot Flick-up|1|B01
T02|Sole-Roll Flick-up|2|T01
T03|Heel-Lift Flick-up|2|T01
T04|Slap Flick-up|3|B04,T01
T05|ATW → Crossover Combination|3|L06,L01
T06|ATW → ATW Combination|3|L06,L07
T07|Crossover → HTW Combination|3|L01,L08
T08|ATW → HTW → ATW Chain|4|L06,L08,T06
T09|Three Consecutive ATWs|4|L06
T10|TATW → ATW Combination|4|L16,L06
T11|MATW → ATW Combination|4|L17,L06
T12|Flick-up → Neck Stall|3|T01,U05
T13|Neck Stall → Thigh Catch|3|U05,B03
T14|Neck Flick → Sitdown|4|U06,S03
T15|Foot Stall → Neck Catch|4|B01,U05
T16|Sitdown → Standing Juggling|4|S03,C04
T17|Sole Stall → Sitdown Crossover|4|S14,S05
T18|Lower → Upper → Sitdown Routine|5|T12,T14,T16
T19|Three-Element Advanced Lower Chain|5|L27,L30
T20|60-Second Multi-Style Routine|5|T18,T19,U20,S20
`.trim().split('\n').map(line=>{
  const [id,name,level,prereqs] = line.split('|');
  return {id,name,level:Number(level),prereqs:prereqs?prereqs.split(','):[],category:id[0]};
});
