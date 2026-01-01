
import { TimetableEntry, AnalysisResult, ScannedMetadata, ScheduleSlot } from '../types';

/**
 * MOTEUR D'EXTRACTION JAVASCRIPT PUR (SANS IA)
 * Analyse les emplois du temps CMC Oriental en utilisant pdf.js
 */

const SESSIONS_CONFIG = [
  { start: "8H30", display: "08:30 - 11:00" },
  { start: "11H", display: "11:00 - 13:30" },
  { start: "13H30", display: "13:30 - 16:00" },
  { start: "16H", display: "16:00 - 18:30" },
];

const DAYS_CONFIG = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
const DAYS_MAPPING: Record<string, string> = {
  "LUNDI": "Lundi",
  "MARDI": "Mardi",
  "MERCREDI": "Mercredi",
  "JEUDI": "Jeudi",
  "VENDREDI": "Vendredi",
  "SAMEDI": "Samedi"
};

const ANALYSIS_CACHE_KEY = 'cmc_analysis_cache_js_v2';

/**
 * Fonction principale d'analyse utilisant pdf.js
 */
async function extractDataFromPdf(pdfUrl: string): Promise<ScheduleSlot[]> {
  try {
    const pdfjsLib = (window as any).pdfjsLib;
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });

    // Extraction de tous les éléments de texte avec leurs positions
    const items = textContent.items.map((item: any) => ({
      str: item.str.trim(),
      x: item.transform[4],
      y: viewport.height - item.transform[5], // Inverser Y pour avoir le haut à 0
      w: item.width,
      h: item.height
    })).filter((item: any) => item.str !== "");

    // 1. Trouver les ancres des jours (Rows)
    const dayAnchors = DAYS_CONFIG.map(day => {
      const found = items.find((it: any) => it.str.toUpperCase() === day);
      return found ? { day, y: found.y } : null;
    }).filter(Boolean) as { day: string, y: number }[];

    // 2. Trouver les ancres des créneaux horaires (Columns)
    const timeAnchors = SESSIONS_CONFIG.map(config => {
      // On cherche les en-têtes comme "8H30 ----------> 11H" ou juste "8H30"
      const found = items.find((it: any) => it.str.includes(config.start));
      return found ? { start: config.start, display: config.display, x: found.x } : null;
    }).filter(Boolean) as { start: string, display: string, x: number }[];

    const results: ScheduleSlot[] = [];

    // 3. Pour chaque jour et chaque créneau, chercher les mots-clés à proximité
    for (const dayAnchor of dayAnchors) {
      for (const timeAnchor of timeAnchors) {
        
        // Définir une zone de recherche (Bounding Box du slot)
        const cellItems = items.filter((it: any) => {
          const dy = it.y - dayAnchor.y;
          const dx = it.x - timeAnchor.x;
          // Un slot fait environ 180px de large et 45px de haut. On ajuste les tolérances.
          return Math.abs(dy) < 45 && dx >= -10 && dx < 190;
        });

        if (cellItems.length === 0) continue;

        // Extraction des valeurs spécifiques
        let teacher = "";
        let room = "";
        let module = "";

        // On parcourt les éléments de la cellule pour trouver les labels
        cellItems.forEach((it: any, index: number) => {
          const text = it.str.toUpperCase();
          
          const cleanVal = (rawStr: string) => {
            const parts = rawStr.split(":");
            return parts.length > 1 ? parts[1].trim() : "";
          };

          const getNextValIfLabelEmpty = (current: string, idx: number) => {
            if (current) return current;
            // On cherche dans les items suivants de la même cellule
            for (let j = idx + 1; j < cellItems.length; j++) {
              const nextStr = cellItems[j].str.trim();
              const nextUpper = nextStr.toUpperCase();
              // Si on tombe sur un autre label, on s'arrête
              if (nextUpper.includes("FORMATEUR") || nextUpper.includes("SALLE") || nextUpper.includes("MODULE")) {
                // Sauf si c'est exactement le même label répété sans valeur (arrive parfois en PDF)
                if (nextUpper.startsWith("MODULE :") || nextUpper.startsWith("FORMATEUR :") || nextUpper.startsWith("SALLE :")) {
                   const v = cleanVal(nextStr);
                   if (v) return v;
                   continue;
                }
                break;
              }
              if (nextStr) return nextStr;
            }
            return "";
          };

          if (text.includes("FORMATEUR")) {
            const val = getNextValIfLabelEmpty(cleanVal(it.str), index);
            if (val) teacher = val;
          } else if (text.includes("SALLE")) {
            const val = getNextValIfLabelEmpty(cleanVal(it.str), index);
            if (val) room = val;
          } else if (text.includes("MODULE")) {
            const val = getNextValIfLabelEmpty(cleanVal(it.str), index);
            // On ne remplace pas si on a déjà trouvé une valeur et que celle-ci est vide
            if (val && val.toUpperCase() !== "MODULE") {
              module = val;
            }
          }
        });

        if (teacher || room || module) {
          results.push({
            day: DAYS_MAPPING[dayAnchor.day],
            time: timeAnchor.display,
            teacher: teacher || "Non défini",
            room: room || "Salle Non Définie",
            module: module || "Non défini"
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error("Erreur d'extraction PDF local:", error);
    return [];
  }
}

export const analyzeTimetables = async (entries: TimetableEntry[], onProgress?: (p: number) => void): Promise<AnalysisResult> => {
  const now = new Date();
  const currentDayIndex = now.getDay();
  const daysInFrench = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const currentDayName = daysInFrench[currentDayIndex];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Cache local
  const rawCache = localStorage.getItem(ANALYSIS_CACHE_KEY);
  const cache: Record<string, { slots: ScheduleSlot[], timestamp: string }> = rawCache ? JSON.parse(rawCache) : {};

  const scans: ScannedMetadata[] = [];
  const total = entries.length;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (onProgress) onProgress(Math.round(((i + 1) / total) * 100));

    let fullSchedule: ScheduleSlot[] = [];
    const cacheKey = `${entry.id}_${entry.lastUpdated}`;

    if (cache[cacheKey]) {
      fullSchedule = cache[cacheKey].slots;
    } else if (entry.pdfUrl && entry.pdfUrl !== "#") {
      // Appel à l'extracteur JavaScript local
      fullSchedule = await extractDataFromPdf(entry.pdfUrl);
      cache[cacheKey] = { slots: fullSchedule, timestamp: entry.lastUpdated || now.toISOString() };
    }

    // Détermination de la séance actuelle pour le dashboard
    const activeSlot = fullSchedule.find(slot => {
      if (slot.day !== currentDayName) return false;
      const [startStr] = slot.time.split(" - ");
      const [h, m] = startStr.split(":").map(Number);
      const slotStartMin = h * 60 + m;
      return currentMinutes >= slotStartMin && currentMinutes < (slotStartMin + 150);
    });

    scans.push({
      fileName: `${entry.group}.pdf`,
      detectedPole: entry.pole,
      detectedGroup: entry.group,
      idCode: entry.id,
      period: "2025/2026",
      fullSchedule: fullSchedule,
      teachers: Array.from(new Set(fullSchedule.map(s => s.teacher).filter(t => t !== "Non défini"))),
      rooms: Array.from(new Set(fullSchedule.map(s => s.room).filter(r => r !== "Salle Non Définie"))),
      modules: Array.from(new Set(fullSchedule.map(s => s.module).filter(m => m !== "Non défini"))),
      occupancyRate: activeSlot ? 100 : 0
    });
  }

  localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(cache));

  const activeCount = scans.filter(s => s.occupancyRate > 0).length;

  return {
    totalGroups: entries.length,
    activeGroups: activeCount,
    inactiveGroups: entries.length - activeCount,
    latestScans: scans
  };
};
