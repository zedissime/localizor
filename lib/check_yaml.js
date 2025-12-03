#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

/**
 * Scanne récursivement un dossier pour trouver les fichiers YAML invalides
 * @param {string} dirPath - Chemin du dossier à scanner
 * @param {Array} results - Tableau pour stocker les résultats
 * @returns {Array} Liste des fichiers YAML invalides avec leurs erreurs
 */
function scanYamlFiles(dirPath, results = []) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        // Ignorer les dossiers node_modules, .git, etc.
        if (
          !["node_modules", ".git", ".next", "dist", "build"].includes(
            entry.name
          )
        ) {
          scanYamlFiles(fullPath, results);
        }
      } else if (entry.isFile()) {
        // Vérifier si c'est un fichier YAML
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === ".yml" || ext === ".yaml") {
          validateYamlFile(fullPath, results);
        }
      }
    }
  } catch (error) {
    console.error(`Erreur lors du scan du dossier ${dirPath}:`, error.message);
  }

  return results;
}

/**
 * Valide un fichier YAML
 * @param {string} filePath - Chemin du fichier YAML
 * @param {Array} results - Tableau pour stocker les résultats
 */
function validateYamlFile(filePath, results) {
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");

    // Vérifier si le fichier est vide
    if (!fileContent.trim()) {
      results.push({
        file: filePath,
        valid: false,
        error: "Fichier vide",
      });
      return;
    }

    // Tenter de parser le YAML
    yaml.load(fileContent);

    // Si on arrive ici, le fichier est valide
    // On peut optionnellement logger les fichiers valides
    // console.log(`✓ ${filePath}`);
  } catch (error) {
    results.push({
      file: filePath,
      valid: false,
      error: error.message,
      line: error.mark ? error.mark.line + 1 : null,
      column: error.mark ? error.mark.column + 1 : null,
    });
  }
}

/**
 * Affiche les résultats de la validation
 * @param {Array} results - Résultats de la validation
 */
function displayResults(results) {
  if (results.length === 0) {
    console.log("✅ Tous les fichiers YAML sont valides !");
    return;
  }

  console.log(
    `\n❌ ${results.length} fichier(s) YAML invalide(s) trouvé(s):\n`
  );

  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.file}`);
    console.log(`   Erreur: ${result.error}`);
    if (result.line) {
      console.log(`   Ligne: ${result.line}, Colonne: ${result.column}`);
    }
    console.log("");
  });
}

// Point d'entrée du script
function check() {
  // Récupérer le dossier à scanner depuis les arguments ou utiliser le dossier courant
  const targetDir = process.argv[2] || process.cwd();

  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Le dossier "${targetDir}" n'existe pas.`);
    process.exit(1);
  }

  if (!fs.statSync(targetDir).isDirectory()) {
    console.error(`❌ "${targetDir}" n'est pas un dossier.`);
    process.exit(1);
  }

  console.log(`🔍 Scan du dossier: ${targetDir}\n`);

  const invalidFiles = scanYamlFiles(targetDir);
  displayResults(invalidFiles);

  // Retourner un code d'erreur si des fichiers invalides sont trouvés
  process.exit(invalidFiles.length > 0 ? 1 : 0);
}

// Exécuter le script
module.exports = {
  check,
};
