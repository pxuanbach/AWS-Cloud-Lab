const { cloudwatch } = require('./config/aws');

async function testCloudWatch() {
    try {
        const params = {
            Namespace: 'Group6Blog/Test',
            MetricData: [{
                MetricName: 'TestMetric',
                Value: 1,
                Unit: 'Count',
                Timestamp: new Date()
            }]
        };
        
        const result = await cloudwatch.putMetricData(params).promise();
        console.log('✅ CloudWatch test successful:', result);
    } catch (error) {
        console.error('❌ CloudWatch test failed:', error.message);
        console.error('Full error:', error);
    }
}

testCloudWatch();
