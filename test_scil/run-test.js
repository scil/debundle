const args = require('minimist')(process.argv.slice(2));
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

const bundle_dir = path.resolve(__dirname, 'bundle')
const debundle_dir = path.resolve(__dirname, 'debundle')
const debundle_config_dir = path.resolve(__dirname, 'debundle.config')
const tmp_output_dir = path.resolve(__dirname, 'tmp_debundle')
const debundle_js_cli = path.resolve(__dirname, "../src/index.js")

// ----------------------------------------------------------------------------
// Set up configuration
// ----------------------------------------------------------------------------

const bundle_file_name = args._[0] || args.input || args.i || null;
const showHelp = args.help || args.h


if (showHelp) {
  console.log(`This is a debundler - it takes a bundle and expands it into the source that was used to compile it.`);
  console.log();
  console.log(`Usage: ${process.argv[1]} [input file] {OPTIONS}`);
  console.log();
  console.log(`Options:`);
  console.log(`   --config, -c  Optional. Custom Configuration file, it must exist in ${bundle_dir}.`);
  console.log(`   --help, -h  `);
  console.log();
  process.exit(1);
}


function get_output_name(bundle_file_name) {
  return bundle_file_name.split('-')[0]
}

function read_first_line(file) {
  try {
    // read contents of the file
    const data = fs.readFileSync(file, 'UTF-8');

    // split the contents by new line
    const lines = data.split(/\r?\n/);

    return lines[0];

  } catch (err) {
    console.error(err);
  }

}
function debundle_a_bundle(bundle_file_name, output_name) {
  var bundle_file = path.normalize(bundle_dir+'/'+bundle_file_name)

  var first_line = read_first_line(bundle_file)
  var exec=/debundle\.config=(.+)/.exec(first_line)
  var config_file_name = exec?exec[1]:''

  config_file =  path.resolve(debundle_config_dir, config_file_name)
  if(!(fs.existsSync(config_file) && fs.lstatSync(config_file).isFile())){
    console.error(`[Debundle Error] no config file ${config_file}.Pleae check the first line of ${bundle_file}`);
    return
  }else{
    console.log(`[Debundle config] config file ${config_file}`);

  }

  var cmd = `node ${debundle_js_cli}  -i ${bundle_file} -o ${path.normalize(tmp_output_dir+'/'+output_name)} -c ${config_file}`
  console.log(`[Debundle] ${cmd}`);

  //same as stdio = [process.stdin, process.stdout, process.stderr]
  // http://theantway.com/2016/12/capture-console-output-when-using-child_process-execsync-in-node-js/
  var stdio = 'inherit'
  execSync(cmd,  {stdio: stdio});
}

function test_a_bundle(bundle_file_name) {
  var output_name = get_output_name(bundle_file_name)

  debundle_a_bundle(bundle_file_name, output_name)

  diff_dir(`${debundle_dir}/${output_name}`, `${tmp_output_dir}/${output_name}`)
}

function diff_dir(old_dir,new_dir) {

}

function test_all() {
  try {
    const files = fs.readdirSync(bundle_dir);

    files.forEach(file => {
      console.log(`[Test] ${file}`);
      test_a_bundle(file);
    });

  } catch (err) {
    console.log(err);
  }
}

if (bundle_file_name)
  test_a_bundle(bundle_file_name);
else
  test_all();
