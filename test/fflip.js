'use strict';


//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------
var assert = require('assert'),
	sinon = require('sinon');


//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------
function isObjectEmpty(obj) {
	for(var key in obj) {
		if(obj.hasOwnProperty(key)) {
			return false;
		}
	}
	return true;
};

var sandbox = sinon.sandbox.create();
var fflip = require('../lib/fflip');

var configData = {
	criteria: {
		c1: function(user, bool) {
			return bool;
		},
		c2: function(user, flag) {
			return user.flag == flag;
		}
	},
	features: {
		fEmpty: {},
		fOpen: {
			name: 'fOpen',
			description: 'true for all users',
			criteria: {
				c1: true
			}
		},
		fClosed: { 
			criteria: {
				c1: false
			}
		},
		fEval: {
			criteria: {
				c2: 'abc'
			}
		}
	},
	reload: 0
};

var userABC = {
	flag: 'abc'
};
var userXYZ = {
	flag: 'xyz'
};


//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------
describe('fflip', function(){

	afterEach(function(){
		sandbox.verifyAndRestore();
	});

	describe('config()', function(){

		it('should set features if given static feature object', function(){
			fflip._features = {};
			fflip.config(configData);
			assert.equal(configData.features, fflip._features);
		});

		it('should set features if given a syncronous loading function', function(){
			var loadSyncronously = function() {
				return configData.features;
			};
			fflip.config({features: loadSyncronously});
			assert.equal(configData.features, fflip._features);
		});

		it('should set features if given an asyncronous loading function', function(done){
			var loadAsyncronously = function(callback) {
				callback(configData.features);
				assert.equal(configData.features, fflip._features);
				done();
			};
			fflip.config({features: loadAsyncronously});
		});

		it('should set criteria if given static criteria object', function(){
			fflip._criteria = {};
			fflip.config(configData);
			assert.equal(configData.criteria, fflip._criteria);
		});

		it('should set reloadRate if given reload', function(){
			fflip._reloadRate = 0;
			fflip.config(configData);
			assert.equal(configData.reload*1000, fflip._reloadRate);
		});

	});

	describe('reload()', function(){
		beforeEach(function() {

		});

		it('should be called every X seconds where X = reloadRate', function(done) {
			this.timeout(205);
			var loadAsyncronously = function(callback) {
				callback({});
				done();
			};
			fflip.config({features: loadAsyncronously, reload: 0.2});
		});

		it('should update features', function(done){
			this.timeout(100);
			var testReady = false;
			var loadAsyncronously = function(callback) {
				callback({});
				if(testReady)
					done();
			};
			fflip.config({features: loadAsyncronously});
			testReady = true;
			fflip.reload();
		});

	});

	describe('userHasFeature()', function(){

		beforeEach(function() {
			fflip.config(configData);
		});

		it('should return null if features does not exist', function(){
			assert.equal(null, fflip.userHasFeature(userABC, 'notafeature'));
		});

		it('should return false if no criteria set', function(){
			assert.equal(false, fflip.userHasFeature(userABC, 'fEmpty'));
		});

		it('should return false if all feature critieria evaluates to false', function(){
			assert.equal(false, fflip.userHasFeature(userABC, 'fClosed'));
			assert.equal(false, fflip.userHasFeature(userXYZ, 'fEval'));
		});

		it('should return true if one feature critieria evaluates to true', function(){
			assert.equal(true, fflip.userHasFeature(userABC, 'fOpen'));
			assert.equal(true, fflip.userHasFeature(userABC, 'fEval'));
		});

	});

	describe('userFeatures()', function(){

		beforeEach(function() {
			fflip.config(configData);
		});

		it('should return an object of features for a user', function(){
			var featuresABC = fflip.userFeatures(userABC);
			assert.equal(featuresABC.fEmpty, false);
			assert.equal(featuresABC.fOpen, true);
			assert.equal(featuresABC.fClosed, false);
			assert.equal(featuresABC.fEval, true);
		});

		it('should overwrite values when flags are set', function() {
			var featuresXYZ = fflip.userFeatures(userXYZ);
			assert.equal(featuresXYZ.fEval, false);
			featuresXYZ = fflip.userFeatures(userXYZ, {fEval: true});
			assert.equal(featuresXYZ.fEval, true);
		});

	});

});
