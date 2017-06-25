
import React, {Component, PropTypes} from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    ART
} from 'react-native';

const {Group, Path, Shape, Surface, LinearGradient}=ART;

export  default  class RoundProgress extends Component {

    static defaultProps = {
        baseProgressWidth: 8,
        progressWidth: 10,
        totalNum: 360,
        progress: 0,
        raduis: 100,
        progressColor: '#485759',
        progressBaseColor: '#ffffff',
        centerViewMode: true,
    };

    static propTypes = {
        progress: PropTypes.number,
        totalNum: PropTypes.number,
        progressWidth: PropTypes.number,
        baseProgressWidth: PropTypes.number,
        raduis: PropTypes.number,
        progressColor: PropTypes.string,
        progressBaseColor: PropTypes.string,
        centerViewMode: PropTypes.bool,
    };

    constructor(props) {
        super(props);
        if (this.props.raduis < 0) {
            throw new Error(' radius must >0');
        }

        let size = (this.props.raduis) * 2;
        console.log("size " + size);
        let centerW = Math.sqrt(Math.pow(size / 2 - this.props.progressWidth * 3 / 2, 2) / 2) * 2;
        console.log("centerW " + centerW);
        let marginTop = size / 2 - centerW / 2;
        let marginLeft = size / 2 - centerW / 2;

        console.log("marginLeft " + marginLeft);
        this.state = {
            size: size,
            startX: size / 2,
            startY: this.props.progressWidth,
            //Real radius
            originR: size / 2 - this.props.progressWidth,
            endX: size / 2,
            endY: this.props.progressWidth,
            startX1: size / 2,
            startY1: size - this.props.progressWidth,
            endX1: size / 2,
            endY1: size - this.props.progressWidth,
            centerW: centerW,
            marginTop: marginTop,
            marginLeft: marginLeft,
            target0: null,
            target1: null,
        };
    }

    componentDidMount() {
        this.changeProgress(this.props.progress, this.props.totalNum);
    }

    /**
     * Pass progress value
     * @param progress
     * @param totalNum
     */
    changeProgress(progress, totalNum) {
        let degress = progress / totalNum * 360;
        let target1 = null;
        // First calculate the right side
        let target = null;
        target = calTargetXY(progress, totalNum,
            this.state.startX, this.state.startY, this.state.originR);

        if (degress > 180) {
            //In the calculation of the left
            target1 = calTargetXY1(degress, this.state.startX1, this.state.startY1, this.state.originR);
        }

        if(target==null){
            return;
        }
        if(degress>180&& target1==null){
            return;
        }

        // Initial state
        this.setState({
            target0: target,
            target1: target1,
            endX: target[0],
            endY: target[1],
            endX1: target1 != null ? target1[0] : 0,
            endY1: target1 != null ? target1[1] : 0,
        });
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps != this.props) {
            this.changeProgress(nextProps.progress, nextProps.totalNum);
        }
    }

    shouldComponentUpdate(nextProps, nexStatus) {
        if (nexStatus.target0 != this.state.target0
            || nexStatus.target1 != this.state.target1) {
            return true;
        }
        return false;
    }

    /**
     * The bottom of the two arcs
     * @param flag
     * @returns {*|{index, routes}|NavigationState|ByteVector|Number}
     */
    getBase(flag) {
        if (flag == 0) {
            let pushStr = "M{0},{1} A{2},{3} 0 {4},{5} {6},{7}";
            let result = pushStr.format(this.state.startX, this.state.startY, this.state.originR, this.state.originR,
                0, 1, this.state.startX1, this.state.startY1);
            return new Path().push(result);
        } else {
            let pushStr = "M{0},{1} A{2},{3} 0 {4},{5} {6},{7}";
            let result = pushStr.format(this.state.startX1, this.state.startY1, this.state.originR, this.state.originR,
                0, 1, this.state.startX, this.state.startY);
            return new Path().push(result);
        }
    }

    //The middle view is empty
    getCenterView() {
        if (this.props.centerViewMode) {
            return (
                <View key="centerView" style={[myStyles.centerViewStyle, {
                    width: this.state.centerW,
                    height: this.state.centerW,
                    top: this.state.marginTop,
                    left: this.state.marginLeft,
                }]}>
                    {this.props.children}
                </View>
            );
        } else {
            return null;
        }
    }

    render() {

        const path0 = this.getBase(0);
        const path00 = this.getBase(1);

        let pushStr = "M{0},{1} A{2},{3} 0 {4},{5} {6},{7}";
        let result = pushStr.format(this.state.startX, this.state.startY, this.state.originR, this.state.originR,
            0, 1, this.state.endX, this.state.endY);
        const path = new Path()
            .push(result);

        let pushStr1 = "M{0},{1} A{2},{3} 0 {4},{5} {6},{7}";
        let path1 = new Path();
        if (this.state.endX1 > 0 && this.state.endY1 > 0) {
            let result1 = pushStr1.format(this.state.startX1, this.state.startY1, this.state.originR, this.state.originR,
                0, 1, this.state.endX1, this.state.endY1);
            path1.push(result1);
        }
        return (

            <View >
                <Surface width={this.state.size} height={this.state.size}>
                    <Group>
                        <Shape d={path0} stroke={this.props.progressBaseColor}
                               strokeWidth={this.props.baseProgressWidth}/>
                        <Shape d={path00} stroke={this.props.progressBaseColor}
                               strokeWidth={this.props.baseProgressWidth}/>
                        <Shape d={path} stroke={this.props.progressColor} strokeWidth={this.props.progressWidth}/>
                        <Shape d={path1} stroke={this.props.progressColor} strokeWidth={this.props.progressWidth}/>
                    </Group>
                </Surface>
                {this.getCenterView()}
            </View>

        );
    };
}

const myStyles = StyleSheet.create({

    centerViewStyle: {
        position: 'absolute',
    }
});

/**
 * Calculate the calculation of the target coordinate position on the right <180 degrees
 * @param progress
 * @param total
 * @param startX
 * @param startY
 */
function calTargetXY(progress, total, startX, startY, radius) {
    let degress = progress / total * 360;
    if (degress > 180) {
        degress = 180;
    }
    let target = [];
    if (degress <= 90) {
        degress = degress * 2 * Math.PI / 360;
        let endx = startX + radius * Math.sin(degress);
        let endy = startY + radius - radius * Math.cos(degress);
        target.push(endx);
        target.push(endy);
        return target;
    }
    else if (degress <= 180) {
        degress = degress - 90;
        degress = degress * 2 * Math.PI / 360;
        let endx = startX + radius * Math.cos(degress);
        let endy = startY + radius + radius * Math.sin(degress);
        target.push(endx);
        target.push(endy);
        return target;
    }
    return null;
}

/**
 * Calculate the calculation of the left circle> 180 degrees
 * @param degress
 * @param startX
 * @param startY
 * @param radius
 */
function calTargetXY1(degress, startX, startY, radius) {
    let target = [];
    if (degress > 360) {
        degress = 360;
    }
    if (degress <= 270) {
        degress = degress - 180;
        degress = degress * 2 * Math.PI / 360;
        let endx = startX - radius * Math.sin(degress);
        let endy = startY - ( radius - +radius * Math.cos(degress));
        target.push(endx);
        target.push(endy);
        return target;
    } else if (degress <= 360) {
        degress = degress - 270;
        degress = degress * 2 * Math.PI / 360;
        let endx = startX - radius * Math.cos(degress);
        let endy = startY - radius - radius * Math.sin(degress);
        target.push(endx);
        target.push(endy);
        return target;
    }
}


// String formatting
String.prototype.format = function (args) {
    var result = this;
    if (arguments.length < 1) {
        return result;
    }
    var data = arguments; 
    if (arguments.length == 1 && typeof (args) == "object") {
        data = args;
    }
    for (var key in data) {
        var value = data[key];
        if (undefined != value) {
            result = result.replace("{" + key + "}", value);
        }
    }
    return result;
};

