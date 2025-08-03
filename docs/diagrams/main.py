from diagrams import Diagram, Edge
from diagrams.aws.compute import EC2, EC2AutoScaling
from diagrams.aws.database import RDS
from diagrams.aws.network import ELB
from diagrams.aws.storage import S3
from diagrams.aws.security import IAM
from diagrams.aws.management import Cloudwatch, Cloudtrail
from diagrams.onprem.client import Users

graph_attr = {
    "fontsize": "20",
    "fontname": "Arial Bold",
    "splines": "true",
    "overlap": "false",
    "rankdir": "LR",
    "nodesep": "0.8",
    "ranksep": "1.5",
    "dpi": "300",
    "size": "16,10!",
    "ratio": "expand"
}

node_attr = {
    "fontsize": "16",
    "fontname": "Arial Bold",
    "width": "1.5",
    "height": "1.0"
}

edge_attr = {
    "fontsize": "14",
    "fontname": "Arial Bold",
    "penwidth": "2.0",
    "arrowsize": "1.2"
}

def create_iam_structure():
    """IAM for Group6 Platform"""
    
    with Diagram("Group6 Platform - IAM Structure", 
                 filename="group6_iam_structure", 
                 direction="LR",
                 graph_attr=graph_attr,
                 node_attr=node_attr,
                 edge_attr=edge_attr,
                 show=False):
        
        # IAM Groups
        root_admins = IAM("Root-Admins\n• All AWS Services")
        devops_team = IAM("DevOps-Team\n• Infrastructure Automation")
        developers = IAM("Developers-Team")
        qa_team = IAM("QA-Team")
        security = IAM("Security-Experts\n• Security Auditing")
        
        # IAM Users
        root_user = Users("group6-root-admin\n(System Administrator)")
        devops_user = Users("group6-devops\n(DevOps)")
        dev_user = Users("group6-dev\n(Developer)")
        qa_user = Users("group6-qa\n(QA)")
        sec_user = Users("group6-security-expert\n(Security Specialist)")
        
        # AWS Resources
        ec2_resources = EC2("EC2 Instances")
        rds_resources = RDS("RDS Database")
        s3_resources = S3("S3 Bucket")
        elb_resources = ELB("Load Balancer")
        asg_resources = EC2AutoScaling("Auto Scaling")
        cw_resources = Cloudwatch("CloudWatch")
        ct_resources = Cloudtrail("CloudTrail")
        
        root_admins >> Edge(style="invisible") >> devops_team >> Edge(style="invisible") >> developers >> Edge(style="invisible") >> qa_team >> Edge(style="invisible") >> security
        
        root_user >> Edge(style="invisible") >> devops_user >> Edge(style="invisible") >> dev_user >> Edge(style="invisible") >> qa_user >> Edge(style="invisible") >> sec_user
        
        ec2_resources >> Edge(style="invisible") >> rds_resources >> Edge(style="invisible") >> s3_resources >> Edge(style="invisible") >> elb_resources
        
        root_user >> Edge(color="red", style="bold", penwidth="3") >> root_admins
        devops_user >> Edge(color="blue", style="bold", penwidth="3") >> devops_team
        dev_user >> Edge(color="green", style="bold", penwidth="3") >> developers
        qa_user >> Edge(color="purple", style="bold", penwidth="3") >> qa_team
        sec_user >> Edge(color="orange", style="bold", penwidth="3") >> security
        
        # DevOps Access (Infrastructure)
        devops_team >> Edge(color="blue", label="Full Access", penwidth="2.5") >> ec2_resources
        devops_team >> Edge(color="blue", label="Full Access", penwidth="2.5") >> elb_resources
        devops_team >> Edge(color="blue", label="Full Access", penwidth="2.5") >> asg_resources
        devops_team >> Edge(color="blue", label="Full Access", penwidth="2.5") >> rds_resources
        
        # Developer Access (Limited)
        developers >> Edge(color="green", label="Read/Write", penwidth="2") >> s3_resources
        developers >> Edge(color="green", label="Describe", penwidth="2") >> ec2_resources
        developers >> Edge(color="green", label="Read Only", penwidth="2") >> rds_resources
        
        # QA Access (Monitoring - Purple)
        qa_team >> Edge(color="purple", label="Read Only", penwidth="2") >> s3_resources
        qa_team >> Edge(color="purple", label="Read Only", penwidth="2") >> rds_resources
        qa_team >> Edge(color="purple", label="Monitoring", penwidth="2") >> cw_resources
        
        # Security Access (Audit - Orange)
        security >> Edge(color="orange", label="Full Access", penwidth="2.5") >> ct_resources
        security >> Edge(color="orange", label="Full Access", penwidth="2.5") >> cw_resources

if __name__ == "__main__":
    print("Đang tạo sơ đồ kiến trúc AWS cho Group6 Platform...")
    
    # Tạo sơ đồ cấu trúc IAM
    create_iam_structure()
    print("✅ Đã tạo sơ đồ cấu trúc IAM: group6_iam_structure.png")
    
    print("\n📁 Các file sơ đồ đã được tạo trong thư mục hiện tại:")
    print("   - group6_iam_structure.png")
