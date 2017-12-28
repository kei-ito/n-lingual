module.exports = class LineBreaks extends Array {

	constructor(source) {
		super();
		source.replace(/\r\n|\r|\n/g, (match, index) => {
			this.push(index);
		});
		this.push(Infinity);
	}

	lineAt(index) {
		return this.findIndex((x) => index < x) + 1;
	}

};
