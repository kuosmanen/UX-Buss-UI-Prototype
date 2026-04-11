export type QuickReply = {
  match: RegExp;
  response: string;
};

export type AdaptiveContext = {
  favoriteLine: string;
  currentLocation: string;
  likelyDestination: string;
};

export const quickReplies: QuickReply[] = [
  {
    match: /bus\s*5|line\s*5/i,
    response: "Bus 5 to LUT leaves from Keskusta around 08:25 and 09:25.",
  },
    {
      match: /thank\s*you|thanks|kiitos/i,
      response: "You are welcome. I am happy to help with your trip anytime.",
    },
  {
    match: /ticket|price|cost/i,
    response: "Single ticket is EUR3.20 and day pass is EUR8.90.",
  },
  {
    match: /delay|late/i,
    response: "No major delays right now. Try Refresh on the map page for updated times.",
  },
  {
    match: /nearest|stop/i,
    response: "Nearest stop in this demo is Torin pysakki. You can also check the map page.",
  },
  {
    match: /plan|trip|journey|travel/i,
    response:
      "I can build your trip in one step: start stop, destination, transfer suggestion, and a fallback route if a delay appears.",
  },
  {
    match: /personal|habit|learn|adapt/i,
    response:
      "I adapt to your travel habits by learning your frequent lines, common times, and preferred stops, then prioritizing those automatically.",
  },
  {
    match: /accessibility|accessible|wheelchair|step[- ]?free/i,
    response:
      "I can prioritize low-floor buses, wheelchair-friendly stops, and simpler walking transfers for accessibility needs.",
  },
  {
    match: /traveling|on board|onboard|during trip|while traveling/i,
    response:
      "During travel, I can proactively alert about the next stop, transfer timing, and disruption alternatives in natural language.",
  },
  {
    match: /why chatbot|why ai|benefit|better than ui/i,
    response:
      "Chat feels more natural than navigating many screens: users can ask directly and get personalized guidance instantly.",
  },
];

export function getLocationAwareResponse(prompt: string, context: AdaptiveContext): string | null {
  if (
    /when.*(leave|leaving|next).*(city\s*cent(re|er)|downtown)|to\s*(the\s*)?city\s*cent(re|er)|from\s*(the\s*)?(university|lut)/i.test(
      prompt
    )
  ) {
    return `From ${context.currentLocation}, the next bus towards ${context.likelyDestination} leaves in about 6 minutes, then another in about 18 minutes.`;
  }

  return null;
}

export function getBriefAlignedResponse(prompt: string, context: AdaptiveContext): string | null {
  if (/plan my next trip/i.test(prompt)) {
    return `I built a personalized next trip for you: from ${context.currentLocation} to ${context.likelyDestination} via line ${context.favoriteLine}, with one low-walk transfer and a backup route if delays occur.`;
  }

  if (/demo|presentation|brief/i.test(prompt)) {
    return "In this demo, AI reduces steps by turning intent into direct travel guidance, then adapts recommendations from your repeated behavior.";
  }

  if (/anxious|confus|overwhelm|hard to use/i.test(prompt)) {
    return "I can simplify navigation by giving one clear next action at a time and avoiding UI overload.";
  }

  return null;
}

export function getFallbackResponse(context: AdaptiveContext): string {
  return (
    "I can guide your trip in one step. " +
    `Try: \"When is bus ${context.favoriteLine} leaving to city centre?\", \"Is line ${context.favoriteLine} delayed?\", or \"Find an accessible route from ${context.currentLocation}\".`
  );
}
