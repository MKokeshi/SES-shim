/* eslint no-shadow: 0 */

import { writeZip } from "./zip.js";
import { resolve } from "./node-module-specifier.js";
import { compartmentMapForNodeModules } from "./compartmap.js";
import { search } from "./search.js";
import { assemble } from "./assemble.js";
import { makeImportHookMaker } from "./import-hook.js";
import * as json from "./json.js";

const encoder = new TextEncoder();

const resolveLocation = (rel, abs) => new URL(rel, abs).toString();

const { entries, fromEntries, values } = Object;

const renameCompartments = compartments => {
  const renames = {};
  let n = 0;
  for (const [name, compartment] of entries(compartments)) {
    const { label } = compartment;
    renames[name] = `${label}-n${n}`;
    n += 1;
  }
  return renames;
};

const translateCompartmentMap = (compartments, sources, renames) => {
  const result = {};
  for (const [name, compartment] of entries(compartments)) {
    const { label } = compartment;

    // rename module compartments
    const modules = {};
    for (const [name, module] of entries(compartment.modules || {})) {
      const compartment = module.compartment
        ? renames[module.compartment]
        : undefined;
      modules[name] = {
        ...module,
        compartment
      };
    }

    // integrate sources into modules
    const compartmentSources = sources[name];
    for (const [name, source] of entries(compartmentSources || {})) {
      const { location, parser, exit } = source;
      modules[name] = {
        location,
        parser,
        exit
      };
    }

    result[renames[name]] = {
      label,
      location: renames[name],
      modules
      // `scopes`, `types`, and `parsers` are not necessary since every
      // loadable module is captured in `modules`.
    };
  }

  return result;
};

const renameSources = (sources, renames) => {
  return fromEntries(
    entries(sources).map(([name, compartment]) => [renames[name], compartment])
  );
};

const addSourcesToArchive = async (archive, sources) => {
  for (const [compartment, modules] of entries(sources)) {
    const compartmentLocation = resolveLocation(`${compartment}/`, "file:///");
    for (const { location, bytes } of values(modules)) {
      const moduleLocation = resolveLocation(location, compartmentLocation);
      const path = new URL(moduleLocation).pathname.slice(1); // elide initial "/"
      // eslint-disable-next-line no-await-in-loop
      await archive.write(path, bytes);
    }
  }
};

export const makeArchive = async (read, moduleLocation) => {
  const {
    packageLocation,
    packageDescriptorText,
    packageDescriptorLocation,
    moduleSpecifier
  } = await search(read, moduleLocation);

  const packageDescriptor = json.parse(
    packageDescriptorText,
    packageDescriptorLocation
  );
  const compartmentMap = await compartmentMapForNodeModules(
    read,
    packageLocation,
    [],
    packageDescriptor
  );

  const { compartments, main } = compartmentMap;
  const sources = {};

  const makeImportHook = makeImportHookMaker(
    read,
    packageLocation,
    sources,
    compartments
  );

  // Induce importHook to record all the necessary modules to import the given module specifier.
  const compartment = assemble(compartmentMap, {
    resolve,
    makeImportHook
  });
  await compartment.load(moduleSpecifier);

  const renames = renameCompartments(compartments);
  const renamedCompartments = translateCompartmentMap(
    compartments,
    sources,
    renames
  );
  const renamedSources = renameSources(sources, renames);

  const manifest = {
    main: renames[main],
    entry: moduleSpecifier,
    compartments: renamedCompartments
  };
  const manifestText = JSON.stringify(manifest, null, 2);
  const manifestBytes = encoder.encode(manifestText);

  const archive = writeZip();
  await archive.write("compartmap.json", manifestBytes);
  await addSourcesToArchive(archive, renamedSources);

  return archive.data();
};

export const writeArchive = async (
  write,
  read,
  archiveLocation,
  moduleLocation
) => {
  const archiveBytes = await makeArchive(read, moduleLocation);
  await write(archiveLocation, archiveBytes);
};
