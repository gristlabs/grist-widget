# Create out folder if it doesn't exist
mkdir -p out

# Define array if icons to copy
declare -a icons=("three-dots" "arrows-collapse-vertical" "exclamation-octagon")

# Copy icons to out folder
for icon in "${icons[@]}"
do
  cp node_modules/@shoelace-style/shoelace/dist/assets/icons/$icon.svg out/
done