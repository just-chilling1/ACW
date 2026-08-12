import type { ShortsScript } from "@/lib/vault/shorts-types";

export const TECH_GADGETS_SHORTS: ShortsScript[] = [
  {
    id: "s-tech-01",
    nicheId: "tech_gadgets",
    angle: "Half-house Wi-Fi dead zones",
    format: "Three mistakes",
    title: "Three Reasons Wi-Fi Is Slow In Half Your House",
    platforms: ["tiktok", "reels", "shorts"],
    durationSeconds: 33,
    hook: "Your internet can be fast at the router and useless down the hall. These three setup mistakes explain the gap.",
    beats: [
      {
        timecode: "0:04-0:11",
        voiceover:
          "Mistake one: the router is hidden in a cabinet. Wood, walls, and nearby metal weaken the signal before it reaches the hallway.",
        onScreen: "1. Hidden in a cabinet",
        visual:
          "Object shot of a router inside a closed media cabinet, followed by a simple signal graphic fading through the door.",
      },
      {
        timecode: "0:11-0:19",
        voiceover:
          "Mistake two: it sits at one end of the house. Put it on an open shelf closer to the middle, above floor level.",
        onScreen: "2. Stuck at one end",
        visual:
          "Top-down floor-plan graphic with the router icon moving from a corner room toward a central open shelf.",
      },
      {
        timecode: "0:19-0:27",
        voiceover:
          "Mistake three: every device uses the same band. The higher-frequency band is faster nearby. The lower-frequency band usually reaches farther through walls.",
        onScreen: "3. Wrong band for the room",
        visual:
          "Two-lane graphic labeled faster nearby and farther through walls, with phone and TV icons moving to the suitable lane.",
      },
      {
        timecode: "0:27-0:33",
        voiceover:
          "Move it into the open, test both bands in the slow room, and keep it away from large metal appliances.",
        onScreen: "Move. Switch. Test again.",
        visual:
          "Checklist card showing open shelf, test both bands, and avoid metal, with each item receiving a check.",
      },
    ],
    cta: "Go to my bio for the written room-by-room Wi-Fi checklist and run the tests in order.",
    caption: `Slow Wi-Fi in half the house often starts with placement, band choice, or interference. Move the router into the open, closer to the middle, then test both bands in the slow room. Full room-by-room checklist: __LINK__`,
    hashtags: ["wifi", "homenetwork", "techtips", "routerplacement"],
    visualStyle:
      "Faceless. Use router object shots, a simple floor plan, and clean signal graphics. Burn in large captions for silent viewing.",
    soundNote:
      "Steady low-key beat beneath a calm voiceover. Use one soft click as each mistake number appears.",
  },
  {
    id: "s-tech-02",
    nicheId: "tech_gadgets",
    angle: "Speed plan myth",
    format: "Myth vs truth",
    title: "More Internet Speed Rarely Fixes A Weak Room",
    platforms: ["tiktok", "reels", "shorts"],
    durationSeconds: 28,
    hook: "Before paying for faster internet, run this two-room test. Your plan may not be the bottleneck.",
    beats: [
      {
        timecode: "0:03-0:09",
        voiceover:
          "The myth: a faster plan fixes buffering everywhere. That only changes how much internet reaches the router.",
        onScreen: "Myth: more speed fixes Wi-Fi",
        visual:
          "Plain text card with MORE SPEED, then an animated line reaching a router icon and stopping there.",
      },
      {
        timecode: "0:09-0:16",
        voiceover:
          "The truth: the router still has to carry that connection through distance, walls, metal, and interference.",
        onScreen: "Truth: signal still travels",
        visual:
          "Simple house diagram showing a signal crossing two walls, fading beside a metal appliance, and arriving weak at a TV.",
      },
      {
        timecode: "0:16-0:23",
        voiceover:
          "Test beside the router, then test in the problem room. Fast nearby and slow far away points to Wi-Fi coverage, not the plan.",
        onScreen: "Compare two rooms",
        visual:
          "Screen recording of two generic speed-test result cards labeled beside router and problem room, with no provider name visible.",
      },
      {
        timecode: "0:23-0:28",
        voiceover:
          "Fix placement and choose the right band first. Consider more speed only when the nearby test is also too slow.",
        onScreen: "Fix coverage before capacity",
        visual: "Plain text card reading FIX COVERAGE FIRST with a small router and room icon.",
      },
    ],
    cta: "Open my bio for the written two-room diagnosis before you change your internet plan.",
    caption: `More speed at the router does not guarantee a strong signal in every room. Compare one test beside the router with one in the problem room, then fix coverage before capacity. Full two-room diagnosis: __LINK__`,
    hashtags: ["wifi", "internetspeed", "homenetwork", "techmyths"],
    visualStyle:
      "Faceless. Use text cards, a generic house diagram, and cropped speed-test screens with no names, ads, or personal details.",
    soundNote:
      "Quiet pulse under the voiceover. Drop the music briefly when the truth card replaces the myth card.",
  },
  {
    id: "s-tech-03",
    nicheId: "tech_gadgets",
    angle: "Movie-night buffering",
    format: "POV story",
    title: "The Buffering Circle Always Picks The Best Scene",
    platforms: ["tiktok", "reels", "shorts"],
    durationSeconds: 37,
    hook: "POV: the buffering circle appears at the best scene—and your internet plan may be innocent.",
    beats: [
      {
        timecode: "0:04-0:12",
        voiceover:
          "You press play again. It runs for twenty seconds, freezes, then drops the picture quality. Everyone blames the internet plan.",
        onScreen: "Of course it freezes now",
        visual:
          "Close object shot of a television displaying a generic loading circle, then a remote pressing play with no people visible.",
      },
      {
        timecode: "0:12-0:20",
        voiceover:
          "Meanwhile, a laptop is backing up files, two phones are updating, and the television is two walls from the router.",
        onScreen: "The house is sharing one lane",
        visual:
          "Animated device icons sending data toward one router while a floor-plan overlay shows two walls before the television.",
      },
      {
        timecode: "0:20-0:29",
        voiceover:
          "Pause the background traffic. Restart the streaming device. If the router is nearby, use the faster short-range band. Farther away, test the longer-range band.",
        onScreen: "Pause. Restart. Switch bands.",
        visual:
          "Faceless screen recording pausing a generic backup, followed by object shots of a streaming device restarting and a Wi-Fi band menu.",
      },
      {
        timecode: "0:29-0:37",
        voiceover:
          "The scene plays through. No new plan. Just fewer devices competing and a connection chosen for that room.",
        onScreen: "Smooth again, without guessing",
        visual:
          "The same television now playing a generic landscape scene smoothly while a small traffic meter settles.",
      },
    ],
    cta: "Go to my bio for the written movie-night checklist and try the fixes in order.",
    caption: `When a movie buffers at the worst moment, check traffic inside the house before changing the plan. Pause backups, restart the streaming device, and test the band that fits the room. Full movie-night checklist: __LINK__`,
    hashtags: ["streaming", "buffering", "wifi", "movienight", "techtips"],
    visualStyle:
      "Faceless. Film the television, remote, router, and device menus only. Use generic screens and hide all account details.",
    soundNote:
      "Start with a brief tense drone during the loading circle, then settle into a soft beat once the checks begin.",
  },
  {
    id: "s-tech-04",
    nicheId: "tech_gadgets",
    angle: "Read a speed test",
    format: "Screen demo",
    title: "What Your Wi-Fi Speed Test Actually Means",
    platforms: ["tiktok", "reels", "shorts"],
    durationSeconds: 40,
    hook: "Those three speed-test numbers are answering different questions. One of them is probably not what you think.",
    beats: [
      {
        timecode: "0:04-0:12",
        voiceover:
          "Stand beside the router, close active downloads, and run one test. This is your clean comparison, not the final verdict.",
        onScreen: "Test 1: beside the router",
        visual:
          "Screen recording opening a generic speed-test page, starting the test, and showing a result with all site branding cropped out.",
      },
      {
        timecode: "0:12-0:20",
        voiceover:
          "Download is how quickly data reaches you. It matters for streaming and large files. One device rarely needs the entire plan at once.",
        onScreen: "Download = data coming in",
        visual:
          "Cursor circles the download result while a simple arrow moves from a cloud icon toward a laptop.",
      },
      {
        timecode: "0:20-0:28",
        voiceover:
          "Upload is data leaving your home. It matters for video calls, cloud backups, and sending large files.",
        onScreen: "Upload = data going out",
        visual:
          "Cursor circles the upload result while an arrow moves from the laptop toward a cloud icon.",
      },
      {
        timecode: "0:28-0:34",
        voiceover:
          "Latency is the delay before data responds. Lower is better for calls, games, and anything that needs quick reactions.",
        onScreen: "Latency = response delay",
        visual:
          "Cursor circles the latency result as a small stopwatch graphic appears beside it.",
      },
      {
        timecode: "0:34-0:40",
        voiceover:
          "Now repeat the test in the slow room. A large drop there points to placement, band choice, or interference.",
        onScreen: "Test 2: the slow room",
        visual:
          "Side-by-side result cards labeled near router and slow room, followed by icons for placement, bands, and interference.",
      },
    ],
    cta: "Open my bio for the written speed-test guide and keep it beside your results.",
    caption: `Read a speed test in plain English: download is data coming in, upload is data going out, and latency is response delay. Compare beside the router with the slow room to spot a coverage problem. Full speed-test walkthrough: __LINK__`,
    hashtags: ["speedtest", "wifi", "internettips", "homenetwork", "techhelp"],
    visualStyle:
      "Faceless screen demo. Crop names and ads from the test page. Enlarge each result and burn in a one-line definition.",
    soundNote:
      "Minimal click-track beneath a measured voiceover. Add a quiet tap when each result is circled.",
  },
  {
    id: "s-tech-05",
    nicheId: "tech_gadgets",
    angle: "Router placement comparison",
    format: "Before and after",
    title: "The Same Room Before And After Moving The Router",
    platforms: ["tiktok", "reels", "shorts"],
    durationSeconds: 35,
    hook: "Same room. Same plan. No new gear. Watch what changes when the router moves out of one bad hiding place.",
    beats: [
      {
        timecode: "0:03-0:10",
        voiceover:
          "Before: the router sits low inside a cabinet at the far end of the house, beside a large metal appliance.",
        onScreen: "Before: hidden, low, far away",
        visual:
          "Object shot following a router cable into a low cabinet, then panning to a nearby metal appliance.",
      },
      {
        timecode: "0:10-0:18",
        voiceover:
          "In the problem room, the signal drops and the speed test struggles. The connection has crossed distance, doors, and interference.",
        onScreen: "Problem room: weak signal",
        visual:
          "Screen recording of a generic speed test in the problem room, overlaid with a floor-plan path crossing doors and walls.",
      },
      {
        timecode: "0:18-0:26",
        voiceover:
          "After: move the same router to an open shelf closer to the middle. Keep it above the floor and clear of metal.",
        onScreen: "After: open, high, central",
        visual:
          "Faceless object shot of hands placing the router on a central open shelf, then clearing nearby metal objects.",
      },
      {
        timecode: "0:26-0:35",
        voiceover:
          "Run the same test from the same spot. A stronger result means placement was the bottleneck. If it is still weak, test the longer-range band next.",
        onScreen: "Same spot. Stronger result.",
        visual:
          "Before-and-after result cards appear side by side, followed by a generic menu showing the longer-range Wi-Fi band.",
      },
    ],
    cta: "Get the written router-placement map from my bio and test your rooms one by one.",
    caption: `Before buying anything, move the same router from a low hidden corner to an open central shelf. Test from the same room before and after. If the result improves, placement was likely the bottleneck. Full placement map: __LINK__`,
    hashtags: ["routerplacement", "wifi", "beforeandafter", "homenetwork"],
    visualStyle:
      "Faceless. Match the before and after camera angles, use generic test screens, and show only hands when moving the router.",
    soundNote:
      "Muted beat for the before shots, then a slightly brighter version after the move. Keep the transition restrained.",
  },
];
