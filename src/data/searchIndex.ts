import { NAV_LINKS } from "./site";
import { ROSTERS, ROSTER_YEARS } from "./team";
import { BLOG_POSTS } from "./blog";
import { galleryData } from "./gallery";
import { achievements } from "./achievements";
import { publications } from "./publications";
import { mediaCoverage } from "./mediaCoverage";

export interface SearchItem {
  title: string;
  section: string;
  path: string;
  words: string[];
}

function toWords(...parts: (string | undefined)[]): string[] {
  return parts
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function buildIndex(): SearchItem[] {
  const items: SearchItem[] = [];

  for (const link of NAV_LINKS) {
    items.push({ title: link.label, section: "Page", path: link.path, words: toWords(link.label) });
  }

  const roster = ROSTERS[ROSTER_YEARS[0]];

  for (const member of roster.leadership) {
    if (member.hidden || !member.name.trim()) continue;
    items.push({
      title: member.name,
      section: member.roleLabel || "Leadership",
      path: "/team#leadership",
      words: toWords(member.name, member.role, member.department),
    });
  }

  for (const division of roster.divisions) {
    for (const head of division.heads ?? []) {
      if (head.hidden || !head.name.trim()) continue;
      items.push({
        title: head.name,
        section: head.roleLabel || division.name,
        path: `/team#division-${division.num}`,
        words: toWords(head.name, head.role, division.name, head.department),
      });
    }
    for (const section of division.sections) {
      for (const member of section.members) {
        if (member.hidden || !member.name.trim()) continue;
        items.push({
          title: member.name,
          section: member.roleLabel || section.name,
          path: `/team#${section.id}`,
          words: toWords(member.name, member.role, section.name, member.department),
        });
      }
    }
  }

  for (const post of BLOG_POSTS) {
    items.push({
      title: post.title,
      section: "Blog",
      path: `/blog/${post.id}`,
      words: toWords(post.title, post.excerpt, post.category, post.author),
    });
  }

  for (const item of galleryData) {
    items.push({
      title: item.title,
      section: "Gallery",
      path: "/gallery",
      words: toWords(item.title, item.category),
    });
  }

  for (const a of achievements) {
    items.push({
      title: a.title,
      section: `History — ${a.year}`,
      path: "/history",
      words: toWords(a.title, a.blurb, a.year, ...a.awards.map((w) => `${w.title} ${w.competition}`)),
    });
  }

  for (const p of publications) {
    items.push({
      title: p.title,
      section: "Publications",
      path: "/history",
      words: toWords(p.title, p.venue, p.year, ...p.authors),
    });
  }

  for (const c of mediaCoverage) {
    items.push({
      title: c.outlet,
      section: "Media Coverage",
      path: "/history",
      words: toWords(c.outlet, c.kind, c.language),
    });
  }

  return items;
}

export const SEARCH_INDEX: SearchItem[] = buildIndex();
