// Site-wide SEO constants. Keep in sync with the canonical domain.
export const SITE_URL = 'https://taranaband.in';
export const SITE_NAME = 'Tarana';
export const SITE_DESCRIPTION =
  'Official website of Tarana, the rock band with classical roots. Tour dates, tickets, merchandise, music videos and more.';

// Official profiles, used so search engines can tell this band apart from other artists named Tarana
export const SOCIAL_PROFILES = [
  'https://www.instagram.com/tarana_theband/',
  'https://www.youtube.com/@Tarana_theband',
  'https://music.youtube.com/channel/UCGYNDql6twFlwoXmVOcjZ0w',
  'https://music.apple.com/us/artist/tarana/1715187375',
  'https://open.spotify.com/artist/0YoC7nY83SVGBNoIYN33qT',
];

// Share image used in link previews (WhatsApp, iMessage, Instagram, Slack)
export const SHARE_IMAGE = {
  url: `${SITE_URL}/opengraph-image.png`,
  width: 1200,
  height: 630,
  alt: 'Tarana | Classical Roots, Rock Energy',
};
