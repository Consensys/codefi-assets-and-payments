# This configures aws – required in all terraform files
provider "aws" {
  profile = var.profile
  region  = var.region
}

# Defines a user that should be able to write to your bucket
resource "aws_iam_user" "mata-user" {
  name = "mata-user-${var.stage}"
}

resource "aws_iam_access_key" "mata-user" {
  user = "${aws_iam_user.mata-user.name}"
}

resource "aws_iam_user_policy" "mata_user_rw" {
  name   = "readWriteS3ObjectPolicy"
  user   = "${aws_iam_user.mata-user.name}"
  policy = <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::mata-s3-bucket-${var.stage}/*"
        }
   ]
}
EOF
}

resource "aws_s3_bucket" "mata_s3_bucket" {
  bucket = "mata-s3-bucket-${var.stage}"
  acl = "private"
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers = ["ETag"]
    max_age_seconds = 3000
  }
}
