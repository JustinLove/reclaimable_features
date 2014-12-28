var spec = require('./lib/spec')
var prompt = require('prompt')
prompt.start()

var modPath = '../../server_mods/com.wondible.pa.reclaimable_features/'
var stream = 'stable'
var media = require('./lib/path').media(stream)
var build = 'ui/main/shared/js/build.js'

module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
    copy: {
      mod: {
        files: [
          {
            src: [
              'modinfo.json',
              'LICENSE.txt',
              'README.md',
              'CHANGELOG.md',
              'com.wondible.pa.reclaimable_features/**',
              'ui/**',
              'pa/**'],
            dest: modPath,
          },
        ],
      },
    },
    jsonlint: {
      all: {
        src: [
          'pa/terrain/**/*.json'
        ]
      },
    },
    json_schema: {
      all: {
        files: {
          'lib/schema.json': [
            'pa/terrain/**/*.json'
          ]
        },
      },
    },
    // copy files from PA, transform, and put into mod
    proc: {
      base_feature: {
        targets: [
          'pa/terrain/generic/base_feature.json'
        ],
        process: function(spec) {
          spec.max_health = 10 // changing this is easier than all the trees
          spec.metal_value = 5 * spec.max_health * 10
          spec.reclaimable = true
          spec.damageable = true // required for reclaim
          // not burnable because I don't know how to turn it back off
        }
      },
      features: { // these just have to exist in the mod to pick up the base changes
        targets: [
          'pa/terrain/*/features/*.json'
        ]
      },
      ice: {
        targets: [
          'pa/terrain/ice/features/base_ice*.json',
        ],
        process: function(spec) {
          spec.burnable = {
            "burn_duration": 0, 
            "damage": 0, 
            "damage_radius": 0, 
            "resistance": 1, 
            "spread_chance": 0
          }
        }
      },
      rocks: {
        targets: [
          'pa/terrain/*/features/base*rock*.json',
          'pa/terrain/lava/features/lava_rock_19.json',
        ],
        process: function(spec) {
          spec.max_health = 25
          spec.metal_value = 10 * spec.max_health * 10
          spec.burnable = {
            "burn_duration": 30, 
            "damage": 4, 
            "damage_radius": 20, 
            "resistance": 200, 
            "spread_chance": 0.07
          }
        }
      },
      metal: {
        targets: [
          'pa/terrain/metal/features/base_metal_feature.json'
        ],
        process: function(spec) {
          spec.max_health = 100
          spec.metal_value = 50 * spec.max_health * 10
          spec.burnable = {
            "burn_duration": 60,
            "damage": 8, 
            "damage_radius": 20, 
            "resistance": 200, 
            "spread_chance": 0.1
          }
        }
      },
      special_points: { // oh dear, that would have been amusing...
        targets: [
          'pa/effects/features/control_point_01.json',
          'pa/terrain/generic/base_metal.json',
        ],
        process: function(spec) {
          spec.reclaimable = false
          spec.damageable = false
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-jsonlint');
  grunt.loadNpmTasks('grunt-json-schema');

  grunt.registerMultiTask('proc', 'Process unit files into the mod', function() {
    if (this.data.targets) {
      var specs = spec.copyPairs(grunt, this.data.targets, media)
      spec.copyUnitFiles(grunt, specs, this.data.process)
    } else {
      var specs = this.filesSrc.map(function(s) {return grunt.file.readJSON(media + s)})
      var out = this.data.process.apply(this, specs)
      grunt.file.write(this.data.dest, JSON.stringify(out, null, 2))
    }
  })

  // Default task(s).
  grunt.registerTask('default', ['proc', 'json_schema', 'jsonlint', 'copy:mod']);

};

